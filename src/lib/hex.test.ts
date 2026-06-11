import { describe, it, expect } from 'vitest';
import { bytesToHex, hexToBytes } from './hex';
import { generateRoomKeypair, signWithRoomKeypair } from './roomKeypair';

// ─── bytesToHex ───────────────────────────────────────────────────────────────

describe('bytesToHex', () => {
  it('encodes a known byte sequence', () => {
    expect(bytesToHex(new Uint8Array([0xde, 0xad, 0xbe, 0xef]))).toBe('deadbeef');
  });

  it('pads single-digit hex nibbles with a leading zero', () => {
    expect(bytesToHex(new Uint8Array([0x00, 0x0f, 0x10]))).toBe('000f10');
  });

  it('returns an empty string for an empty array', () => {
    expect(bytesToHex(new Uint8Array([]))).toBe('');
  });

  it('encodes a 32-byte all-zeros array to 64 hex chars', () => {
    const result = bytesToHex(new Uint8Array(32));
    expect(result).toBe('0'.repeat(64));
    expect(result).toHaveLength(64);
  });

  it('encodes a 32-byte all-0xff array correctly', () => {
    const result = bytesToHex(new Uint8Array(32).fill(0xff));
    expect(result).toBe('ff'.repeat(32));
  });
});

// ─── hexToBytes ───────────────────────────────────────────────────────────────

describe('hexToBytes', () => {
  it('decodes a known hex string', () => {
    expect(hexToBytes('deadbeef')).toEqual(new Uint8Array([0xde, 0xad, 0xbe, 0xef]));
  });

  it('handles uppercase hex', () => {
    expect(hexToBytes('DEADBEEF')).toEqual(new Uint8Array([0xde, 0xad, 0xbe, 0xef]));
  });

  it('handles mixed-case hex', () => {
    expect(hexToBytes('DeAdBeEf')).toEqual(new Uint8Array([0xde, 0xad, 0xbe, 0xef]));
  });

  it('decodes an empty string to an empty array', () => {
    expect(hexToBytes('')).toEqual(new Uint8Array([]));
  });

  it('decodes 64-char all-zeros to 32 zero bytes', () => {
    expect(hexToBytes('0'.repeat(64))).toEqual(new Uint8Array(32));
  });

  it('throws for an odd-length string', () => {
    expect(() => hexToBytes('abc')).toThrow(TypeError);
    expect(() => hexToBytes('abc')).toThrow('odd');
  });

  it('throws for non-hex characters', () => {
    expect(() => hexToBytes('zzzz')).toThrow(TypeError);
    expect(() => hexToBytes('zzzz')).toThrow('non-hex');
  });
});

// ─── round-trip ───────────────────────────────────────────────────────────────

describe('bytesToHex / hexToBytes round-trip', () => {
  it('round-trips arbitrary bytes without loss', () => {
    const original = new Uint8Array(32);
    crypto.getRandomValues(original);
    expect(hexToBytes(bytesToHex(original))).toEqual(original);
  });

  it('round-trips a known 32-byte secret key', () => {
    const known = new Uint8Array(32).fill(0xab);
    expect(hexToBytes(bytesToHex(known))).toEqual(known);
  });
});

// ─── generateRoomKeypair ─────────────────────────────────────────────────────

describe('generateRoomKeypair', () => {
  it('returns valid 64-char lowercase hex secret key', () => {
    const { secretKeyHex } = generateRoomKeypair();
    expect(secretKeyHex).toHaveLength(64);
    expect(secretKeyHex).toMatch(/^[0-9a-f]{64}$/);
  });

  it('returns valid 64-char lowercase hex public key', () => {
    const { publicKeyHex } = generateRoomKeypair();
    expect(publicKeyHex).toHaveLength(64);
    expect(publicKeyHex).toMatch(/^[0-9a-f]{64}$/);
  });

  it('generates unique keypairs each call', () => {
    const a = generateRoomKeypair();
    const b = generateRoomKeypair();
    expect(a.secretKeyHex).not.toBe(b.secretKeyHex);
    expect(a.publicKeyHex).not.toBe(b.publicKeyHex);
  });

  it('secretKeyHex decodes to exactly 32 bytes', () => {
    const { secretKeyHex } = generateRoomKeypair();
    const sk = hexToBytes(secretKeyHex);
    expect(sk).toHaveLength(32);
  });
});

// ─── signWithRoomKeypair ─────────────────────────────────────────────────────

describe('signWithRoomKeypair', () => {
  it('produces a signed Nostr event with required fields', () => {
    const keypair = generateRoomKeypair();
    const template = {
      kind: 1,
      content: 'test',
      created_at: Math.floor(Date.now() / 1000),
      tags: [],
    };
    const signed = signWithRoomKeypair(template, keypair);

    expect(signed.id).toBeDefined();
    expect(signed.sig).toBeDefined();
    expect(signed.pubkey).toBe(keypair.publicKeyHex);
    expect(signed.kind).toBe(1);
    expect(signed.content).toBe('test');
  });

  it('event id is a 64-char hex string', () => {
    const keypair = generateRoomKeypair();
    const template = {
      kind: 30078,
      content: '{}',
      created_at: Math.floor(Date.now() / 1000),
      tags: [['d', 'test-room']],
    };
    const signed = signWithRoomKeypair(template, keypair);
    expect(signed.id).toHaveLength(64);
    expect(signed.id).toMatch(/^[0-9a-f]{64}$/);
  });

  it('signature is a 128-char hex string', () => {
    const keypair = generateRoomKeypair();
    const template = {
      kind: 1,
      content: '',
      created_at: Math.floor(Date.now() / 1000),
      tags: [],
    };
    const signed = signWithRoomKeypair(template, keypair);
    expect(signed.sig).toHaveLength(128);
    expect(signed.sig).toMatch(/^[0-9a-f]{128}$/);
  });

  it('re-encodes secret without loss (hex → bytes → sign is stable)', () => {
    const keypair = generateRoomKeypair();
    const template = {
      kind: 1,
      content: 'stable',
      created_at: 1700000000,
      tags: [],
    };
    const signed1 = signWithRoomKeypair(template, keypair);
    const signed2 = signWithRoomKeypair(template, keypair);
    // Same template + same key → same deterministic id and sig
    expect(signed1.id).toBe(signed2.id);
    expect(signed1.sig).toBe(signed2.sig);
  });
});
