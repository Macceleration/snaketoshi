import type { EventTemplate, NostrEvent } from 'nostr-tools';
import type { GameRoom } from '@/types/room';

/**
 * NIP-78 / application-specific addressable event.
 * kind 30078 is used to store replaceable app data keyed by `d` tag.
 *
 * Security note: the room secret key is embedded in the event so that any
 * joining player can fetch it and publish mutations under the same Nostr
 * author. This is intentional — room state is already public on relays and
 * there is no private data in the room event. The secret only proves authorship
 * for the kind-30078 replaceable event; it is NOT a user's nsec.
 */
export const ROOM_EVENT_KIND = 30078;

/** Build the Nostr event template for a given GameRoom. */
export function serializeRoom(room: GameRoom, secretKeyHex: string): EventTemplate {
  return {
    kind: ROOM_EVENT_KIND,
    content: JSON.stringify(room),
    created_at: Math.floor(Date.now() / 1000),
    tags: [
      ['d', room.id],
      ['code', room.code],
      ['status', room.status],
      ['board', room.boardId],
      // Embed the room secret so any joiner can also publish updates.
      // The room keypair is ephemeral and only authorises room events.
      ['secret', secretKeyHex],
      ['t', 'snaketoshi-room'],
      ['t', 'snaketoshi'],
    ],
  };
}

/** Parse a Nostr event back into a GameRoom. Returns null on any error. */
export function deserializeRoom(event: NostrEvent): GameRoom | null {
  try {
    if (event.kind !== ROOM_EVENT_KIND) return null;
    const room = JSON.parse(event.content) as GameRoom;
    if (!room.id || !room.code || !room.status) return null;
    return room;
  } catch {
    return null;
  }
}

/** Extract the room secret key hex from a room event's tags, if present. */
export function extractRoomSecret(event: NostrEvent): string | null {
  const tag = event.tags.find(([name]) => name === 'secret');
  return tag?.[1] ?? null;
}

/** REQ filter to fetch the latest state of a single room by ID. */
export function roomFilter(roomId: string) {
  return { kinds: [ROOM_EVENT_KIND], '#d': [roomId], limit: 1 };
}

/** REQ filter to find a room by its short join code. */
export function roomCodeFilter(code: string) {
  return { kinds: [ROOM_EVENT_KIND], '#code': [code], limit: 5 };
}
