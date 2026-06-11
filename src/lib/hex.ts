/**
 * Browser-safe hex encoding/decoding helpers.
 *
 * These replace `Buffer.from(bytes).toString('hex')` and
 * `Buffer.from(hex, 'hex')` which rely on the Node.js `Buffer` global
 * that is NOT available in browser builds unless explicitly polyfilled.
 *
 * All functions operate on plain `Uint8Array` and `string` — no Node APIs.
 */

/**
 * Encode a `Uint8Array` to a lowercase hex string.
 *
 * @example
 * bytesToHex(new Uint8Array([0xde, 0xad, 0xbe, 0xef])) // "deadbeef"
 */
export function bytesToHex(bytes: Uint8Array): string {
  return Array.from(bytes)
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
}

/**
 * Decode a hex string to a `Uint8Array`.
 *
 * Accepts upper- or lower-case hex. Throws a `TypeError` if:
 * - the string has an odd number of characters, or
 * - the string contains non-hex characters.
 *
 * @example
 * hexToBytes("deadbeef") // Uint8Array [0xde, 0xad, 0xbe, 0xef]
 */
export function hexToBytes(hex: string): Uint8Array {
  if (hex.length % 2 !== 0) {
    throw new TypeError(`hexToBytes: invalid hex string length ${hex.length} (must be even)`);
  }
  if (hex.length > 0 && !/^[0-9a-fA-F]+$/.test(hex)) {
    throw new TypeError('hexToBytes: string contains non-hex characters');
  }
  const bytes = new Uint8Array(hex.length / 2);
  for (let i = 0; i < bytes.length; i++) {
    bytes[i] = parseInt(hex.slice(i * 2, i * 2 + 2), 16);
  }
  return bytes;
}
