/**
 * Multiplayer configuration
 * Reads VITE_MULTIPLAYER_MODE env variable.
 * Defaults to 'nostr' for production cross-device play.
 * Set VITE_MULTIPLAYER_MODE=local to force same-browser LocalRoomAdapter.
 */

export interface MultiplayerConfig {
  mode: 'local' | 'nostr';
  relays: string[];
}

export function getMultiplayerConfig(): MultiplayerConfig {
  const mode = (import.meta.env.VITE_MULTIPLAYER_MODE ?? 'nostr') === 'local'
    ? 'local'
    : 'nostr';

  return {
    mode,
    relays: [
      'wss://relay.ditto.pub',
      'wss://relay.primal.net',
      'wss://relay.damus.io',
    ],
  };
}

export function isNostrMultiplayer(): boolean {
  return getMultiplayerConfig().mode === 'nostr';
}
