import { NPool, NRelay1 } from '@nostrify/nostrify';
import type { NostrEvent } from '@nostrify/nostrify';
import type { RoomAdapter, GameRoom, RoomPlayer, RoomSubscriptionCallback } from '@/types/room';
import type { Player } from '@/types/game';
import { createGameState, applyRoll } from './gameEngine';
import { createBoardFromSquares } from './boardAdapter';
import squaresData from '@/data/squares.json';
import {
  generateRoomKeypair,
  signWithRoomKeypair,
  storeRoomKeypair,
  loadRoomKeypair,
} from './roomKeypair';
import type { RoomKeypair } from './roomKeypair';
import { hexToBytes } from './hex';
import {
  serializeRoom,
  deserializeRoom,
  extractRoomSecret,
  roomFilter,
  roomCodeFilter,
  ROOM_EVENT_KIND,
} from './nostrRoomSerializer';

// ─── helpers ────────────────────────────────────────────────────────────────

function genRoomId(): string {
  return `room-${Date.now()}-${Math.random().toString(36).slice(2, 11)}`;
}

function genRoomCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = '';
  for (let i = 0; i < 6; i++) code += chars[Math.floor(Math.random() * chars.length)];
  return code;
}

function newestEvent(events: NostrEvent[]): NostrEvent | undefined {
  return events.slice().sort((a, b) => b.created_at - a.created_at)[0];
}

// ─── adapter ────────────────────────────────────────────────────────────────

/**
 * NostrRoomAdapter
 *
 * Stores room state as kind-30078 addressable events on Nostr relays.
 * Every mutation re-publishes the full room document signed with the
 * room's ephemeral keypair.
 *
 * Key design: the room secret key is embedded in the event's `secret` tag.
 * Any device that fetches the room can extract the secret, store it locally,
 * and publish mutations under the same Nostr author. This ensures all
 * kind-30078 events for a room share the same author+d coordinate and the
 * relay's replaceable-event logic works correctly.
 *
 * Guest players: completely supported — no Nostr login required.
 */
export class NostrRoomAdapter implements RoomAdapter {
  private pool: NPool;
  private subs: Map<string, Set<RoomSubscriptionCallback>> = new Map();
  private activeReqs: Map<string, () => void> = new Map();

  constructor(relayUrls: string[]) {
    this.pool = new NPool({
      open: (url) => new NRelay1(url),
      reqRouter: (filters) => {
        const map = new Map<string, typeof filters>();
        for (const url of relayUrls) map.set(url, filters);
        return map;
      },
      eventRouter: () => relayUrls,
    });
  }

  // ── private helpers ───────────────────────────────────────────────────────

  /**
   * Fetch the most recent room event, extract + cache the secret, return room.
   */
  private async fetchRoom(roomId: string): Promise<{ room: GameRoom; keypair: RoomKeypair } | null> {
    try {
      const events = await this.pool.query([roomFilter(roomId)]);
      const ev = newestEvent(events);
      if (!ev) return null;
      const room = deserializeRoom(ev);
      if (!room) return null;

      // Extract and cache the room secret from the event tag
      const secretHex = extractRoomSecret(ev);
      if (secretHex && !loadRoomKeypair(roomId)) {
        // Build keypair from the extracted secret and cache locally
        const { getPublicKey } = await import('nostr-tools');
        const sk = hexToBytes(secretHex);
        const pk = getPublicKey(sk);
        storeRoomKeypair(roomId, { secretKeyHex: secretHex, publicKeyHex: pk });
      }

      const keypair = loadRoomKeypair(roomId);
      if (!keypair) return { room, keypair: { secretKeyHex: '', publicKeyHex: '' } };
      return { room, keypair };
    } catch {
      return null;
    }
  }

  private async publishRoom(room: GameRoom, keypair: RoomKeypair): Promise<void> {
    const signed = signWithRoomKeypair(serializeRoom(room, keypair.secretKeyHex), keypair);
    await this.pool.event(signed);
    this.notify(room.id, room);
  }

  private notify(roomId: string, room: GameRoom): void {
    this.subs.get(roomId)?.forEach(cb => cb(room));
  }

  // ── interface implementation ───────────────────────────────────────────────

  async createRoom(
    boardId: string,
    hostPlayer: Omit<RoomPlayer, 'isHost' | 'isConnected' | 'joinedAt'>,
  ): Promise<GameRoom> {
    const roomId = genRoomId();
    const code = genRoomCode();
    const keypair = generateRoomKeypair();
    storeRoomKeypair(roomId, keypair);

    const player: RoomPlayer = {
      ...hostPlayer,
      isHost: true,
      isConnected: true,
      joinedAt: Date.now(),
    };

    const room: GameRoom = {
      id: roomId,
      code,
      boardId,
      hostId: player.id,
      status: 'lobby',
      players: [player],
      gameState: null,
      createdAt: Date.now(),
    };

    await this.publishRoom(room, keypair);
    localStorage.setItem(`room-${roomId}-player-id`, player.id);
    return room;
  }

  async joinRoom(
    roomId: string,
    player: Omit<RoomPlayer, 'isHost' | 'isConnected' | 'joinedAt'>,
  ): Promise<GameRoom> {
    const result = await this.fetchRoom(roomId);
    if (!result) throw new Error('Room not found');
    const { room, keypair } = result;

    if (room.status === 'complete') throw new Error('This game has already finished');

    // Reconnect if same player id already present (works for active games too)
    const existing = room.players.find(p => p.id === player.id);
    if (existing) {
      existing.isConnected = true;
      if (keypair.secretKeyHex) await this.publishRoom(room, keypair);
      return room;
    }

    // New players can only join during the lobby phase
    if (room.status !== 'lobby') throw new Error('Cannot join — game already started');
    if (room.players.length >= 6) throw new Error('Room is full');

    const newPlayer: RoomPlayer = {
      ...player,
      isHost: false,
      isConnected: true,
      joinedAt: Date.now(),
    };
    room.players.push(newPlayer);

    // Publish using the room keypair (extracted from the event's secret tag).
    // This keeps all mutations under the same author so kind-30078 replace works.
    if (keypair.secretKeyHex) {
      await this.publishRoom(room, keypair);
    }

    return room;
  }

  async joinRoomByCode(
    code: string,
    player: Omit<RoomPlayer, 'isHost' | 'isConnected' | 'joinedAt'>,
  ): Promise<GameRoom> {
    const room = await this.getRoomByCode(code);
    if (!room) throw new Error('Room not found');
    return this.joinRoom(room.id, player);
  }

  async leaveRoom(roomId: string, playerId: string): Promise<void> {
    const result = await this.fetchRoom(roomId);
    if (!result) return;
    const { room, keypair } = result;

    const idx = room.players.findIndex(p => p.id === playerId);
    if (idx === -1) return;

    if (room.status === 'lobby') {
      room.players.splice(idx, 1);
      if (playerId === room.hostId && room.players.length > 0) {
        room.players[0].isHost = true;
        room.hostId = room.players[0].id;
      }
      if (room.players.length === 0) return;
    } else {
      room.players[idx].isConnected = false;
    }

    try {
      if (keypair.secretKeyHex) await this.publishRoom(room, keypair);
    } catch { /* ignore */ }
  }

  async startRoom(roomId: string, hostPlayerId?: string): Promise<GameRoom> {
    const result = await this.fetchRoom(roomId);
    if (!result) throw new Error('Room not found');
    const { room, keypair } = result;

    if (room.status !== 'lobby') throw new Error('Game already started');
    if (hostPlayerId && room.hostId !== hostPlayerId)
      throw new Error('Only the host can start the game');
    if (room.players.length === 0) throw new Error('No players in room');
    if (!keypair.secretKeyHex) throw new Error('Room keypair not available');

    const gamePlayers: Player[] = room.players.map(p => ({
      id: p.id,
      name: p.name,
      color: p.color,
      position: 0,
    }));

    const gameState = createGameState(gamePlayers, {
      roomId: room.id,
      isMultiplayer: true,
    });
    gameState.phase = 'awaiting_roll';

    room.gameState = gameState;
    room.status = 'active';
    room.startedAt = Date.now();

    await this.publishRoom(room, keypair);
    return room;
  }

  async submitRoll(roomId: string, playerId: string, roll: number): Promise<GameRoom> {
    const result = await this.fetchRoom(roomId);
    if (!result) throw new Error('Room not found');
    const { room, keypair } = result;

    if (room.status !== 'active') throw new Error('Game not active');
    if (!room.gameState) throw new Error('Game state not initialized');
    if (room.gameState.phase !== 'awaiting_roll') throw new Error('Not in roll phase');
    if (roll < 1 || roll > 6) throw new Error('Roll must be between 1 and 6');
    if (!keypair.secretKeyHex) throw new Error('Room keypair not available');

    const current = room.gameState.players[room.gameState.currentPlayerIndex];
    if (current.id !== playerId) throw new Error('Not your turn');

    const board = createBoardFromSquares(squaresData as any);
    const result2 = applyRoll(room.gameState, board, roll);

    room.gameState = result2.updatedState;
    room.gameState.phase = 'encounter';
    room.gameState.pendingEventId = result2.event.id;
    if (result2.transition) room.gameState.pendingTransition = result2.transition;

    await this.publishRoom(room, keypair);
    return room;
  }

  async continueTurn(roomId: string, playerId: string): Promise<GameRoom> {
    const result = await this.fetchRoom(roomId);
    if (!result) throw new Error('Room not found');
    const { room, keypair } = result;

    if (room.status !== 'active') throw new Error('Game not active');
    if (!room.gameState) throw new Error('Game state not initialized');
    if (room.gameState.phase !== 'encounter') throw new Error('Not in encounter phase');
    if (!keypair.secretKeyHex) throw new Error('Room keypair not available');

    const current = room.gameState.players[room.gameState.currentPlayerIndex];
    if (current.id !== playerId) throw new Error('Not your turn');

    // Apply snake/ladder transition
    if (room.gameState.pendingTransition) {
      const { to } = room.gameState.pendingTransition;
      room.gameState.players = room.gameState.players.map(p =>
        p.id === current.id ? { ...p, position: to } : p,
      );
      delete room.gameState.pendingTransition;

      if (to >= 72) {
        room.gameState.winner = current.id;
        room.gameState.phase = 'complete';
        room.status = 'complete';
        room.completedAt = Date.now();
        delete room.gameState.pendingEventId;
        await this.publishRoom(room, keypair);
        return room;
      }
    }

    delete room.gameState.pendingEventId;

    if (room.gameState.winner) {
      room.gameState.phase = 'complete';
      room.status = 'complete';
      room.completedAt = Date.now();
    } else {
      room.gameState.currentPlayerIndex =
        (room.gameState.currentPlayerIndex + 1) % room.gameState.players.length;
      room.gameState.phase = 'awaiting_roll';
    }

    await this.publishRoom(room, keypair);
    return room;
  }

  async getRoom(roomId: string): Promise<GameRoom | null> {
    const result = await this.fetchRoom(roomId);
    return result?.room ?? null;
  }

  async getRoomByCode(code: string): Promise<GameRoom | null> {
    try {
      const events = await this.pool.query([roomCodeFilter(code)]);
      const ev = newestEvent(events);
      if (!ev) return null;
      const room = deserializeRoom(ev);
      if (!room) return null;

      // Also cache the secret for this room
      const secretHex = extractRoomSecret(ev);
      if (secretHex && !loadRoomKeypair(room.id)) {
        const { getPublicKey } = await import('nostr-tools');
        const sk = hexToBytes(secretHex);
        const pk = getPublicKey(sk);
        storeRoomKeypair(room.id, { secretKeyHex: secretHex, publicKeyHex: pk });
      }

      return room;
    } catch {
      return null;
    }
  }

  subscribeToRoom(roomId: string, callback: RoomSubscriptionCallback): () => void {
    // Register callback
    if (!this.subs.has(roomId)) this.subs.set(roomId, new Set());
    this.subs.get(roomId)!.add(callback);

    // Open a streaming REQ subscription if not already active
    if (!this.activeReqs.has(roomId)) {
      const controller = new AbortController();
      const signal = controller.signal;

      (async () => {
        try {
          for await (const event of this.pool.req([roomFilter(roomId)], { signal })) {
            if (signal.aborted) break;
            // NPool yields marker tuples — only process real events
            if (Array.isArray(event)) continue;
            const nostrEvent = event as NostrEvent;
            if (nostrEvent.kind !== ROOM_EVENT_KIND) continue;

            const room = deserializeRoom(nostrEvent);
            if (!room) continue;

            // Cache secret from incoming subscription events too
            const secretHex = extractRoomSecret(nostrEvent);
            if (secretHex && !loadRoomKeypair(room.id)) {
              try {
                const { getPublicKey } = await import('nostr-tools');
                const sk = hexToBytes(secretHex);
                const pk = getPublicKey(sk);
                storeRoomKeypair(room.id, { secretKeyHex: secretHex, publicKeyHex: pk });
              } catch { /* ignore */ }
            }

            this.notify(roomId, room);
          }
        } catch {
          // AbortError on cleanup — expected
        }
      })();

      this.activeReqs.set(roomId, () => controller.abort());
    }

    // Return per-callback unsubscribe
    return () => {
      const callbacks = this.subs.get(roomId);
      if (!callbacks) return;
      callbacks.delete(callback);
      if (callbacks.size === 0) {
        this.subs.delete(roomId);
        this.activeReqs.get(roomId)?.();
        this.activeReqs.delete(roomId);
      }
    };
  }

  cleanup(): void {
    this.activeReqs.forEach(abort => abort());
    this.activeReqs.clear();
    this.subs.clear();
  }
}
