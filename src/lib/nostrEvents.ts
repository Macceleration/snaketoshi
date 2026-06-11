import type { Player, Tile, Board } from '@/types/game';
import type { NostrEvent } from '@nostrify/nostrify';

type EventTemplate = Pick<NostrEvent, 'kind' | 'content'> &
  Partial<Pick<NostrEvent, 'tags' | 'created_at'>>;

interface PlayBroadcastParams {
  player: Player;
  tile: Tile;
  roll: number;
  transition?: {
    type: 'snake' | 'ladder';
    from: number;
    to: number;
  };
  board: Board;
  roomId?: string;
}

/**
 * Create a kind 1 note broadcasting a game play
 * Content is human-readable and meme-native
 */
export function createPlayBroadcastEvent(params: PlayBroadcastParams): EventTemplate {
  const { player, tile, roll, transition } = params;
  
  // Build the narrative
  let content = `🎲 ${player.name} rolled ${roll} and landed on square ${tile.number}: ${tile.title} (${tile.sanskrit})\n\n`;
  
  // Add transition drama
  if (transition?.type === 'snake') {
    content += `🐍 Snake! Got humbled from ${transition.from} → ${transition.to}\n\n`;
  } else if (transition?.type === 'ladder') {
    content += `🪜 Ladder! Climbed from ${transition.from} → ${transition.to}\n\n`;
  }
  
  // Add the teaching
  content += `"${tile.reflection}"\n\n`;
  
  // Add market cycle if present
  if (tile.marketCycleLabel) {
    content += `📊 ${tile.marketCycleLabel}\n\n`;
  }
  
  // Add tagline
  content += `— The meming of life 🐸∞🐍\n`;
  content += `Snaketoshi Squares • Moksha Patam`;
  
  // Build tags
  const tags: string[][] = [
    ['t', 'snaketoshi'],
    ['t', 'thememingoflife'],
    ['t', 'mokshapatam'],
  ];
  
  // Add current URL as reference
  if (typeof window !== 'undefined') {
    tags.push(['r', window.location.href]);
  }
  
  // Add square number as reference
  tags.push(['square', tile.number.toString()]);
  
  return {
    kind: 1,
    content,
    tags,
  };
}

/**
 * Create a shorter broadcast for quick shares
 */
export function createQuickPlayBroadcast(params: PlayBroadcastParams): EventTemplate {
  const { player, tile, roll, transition } = params;
  
  let emoji = '🎲';
  if (transition?.type === 'snake') emoji = '🐍';
  if (transition?.type === 'ladder') emoji = '🪜';
  if (tile.number === 72) emoji = '✨';
  
  const content = `${emoji} Square ${tile.number}: ${tile.title}\n"${tile.reflection}"\n\n🐸∞🐍 Snaketoshi Squares`;
  
  const tags: string[][] = [
    ['t', 'snaketoshi'],
    ['t', 'thememingoflife'],
    ['square', tile.number.toString()],
  ];
  
  if (typeof window !== 'undefined') {
    tags.push(['r', window.location.href]);
  }
  
  return {
    kind: 1,
    content,
    tags,
  };
}
