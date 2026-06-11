import { generateSecretKey, getPublicKey } from 'nostr-tools';
import { finalizeEvent } from 'nostr-tools';
import type { EventTemplate } from 'nostr-tools';
import type { NostrEvent } from '@nostrify/nostrify';

export interface RoomKeypair {
  secretKeyHex: string;   // hex-encoded secret key stored in localStorage
  publicKeyHex: string;   // hex-encoded public key used as Nostr author
}

/** Generate a fresh ephemeral keypair for a new room. */
export function generateRoomKeypair(): RoomKeypair {
  const sk = generateSecretKey();
  const pk = getPublicKey(sk);
  return {
    secretKeyHex: Buffer.from(sk).toString('hex'),
    publicKeyHex: pk,
  };
}

/** Sign a Nostr event template with the room keypair. */
export function signWithRoomKeypair(
  template: EventTemplate,
  keypair: RoomKeypair,
): NostrEvent {
  const sk = Uint8Array.from(Buffer.from(keypair.secretKeyHex, 'hex'));
  return finalizeEvent(template, sk) as NostrEvent;
}

const STORAGE_PREFIX = 'room-keypair-';

export function storeRoomKeypair(roomId: string, keypair: RoomKeypair): void {
  try {
    localStorage.setItem(STORAGE_PREFIX + roomId, JSON.stringify(keypair));
  } catch {
    // Storage full / private browsing — silently ignore
  }
}

export function loadRoomKeypair(roomId: string): RoomKeypair | null {
  try {
    const raw = localStorage.getItem(STORAGE_PREFIX + roomId);
    if (!raw) return null;
    return JSON.parse(raw) as RoomKeypair;
  } catch {
    return null;
  }
}

export function isRoomHost(roomId: string): boolean {
  return loadRoomKeypair(roomId) !== null;
}
