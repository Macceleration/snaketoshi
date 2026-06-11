import { getMultiplayerConfig } from '@/config/multiplayer';
import { LocalRoomAdapter } from './roomAdapter';
import { NostrRoomAdapter } from './nostrRoomAdapter';
import type { RoomAdapter } from '@/types/room';

let instance: RoomAdapter | null = null;

/**
 * Returns a singleton RoomAdapter chosen by configuration.
 *
 * VITE_MULTIPLAYER_MODE=nostr  → NostrRoomAdapter (default, cross-device)
 * VITE_MULTIPLAYER_MODE=local  → LocalRoomAdapter (same-browser tabs)
 */
export function getRoomAdapter(): RoomAdapter {
  if (instance) return instance;

  const config = getMultiplayerConfig();

  if (config.mode === 'local') {
    instance = new LocalRoomAdapter();
  } else {
    instance = new NostrRoomAdapter(config.relays);
  }

  return instance;
}

export function resetRoomAdapter(): void {
  instance?.cleanup();
  instance = null;
}
