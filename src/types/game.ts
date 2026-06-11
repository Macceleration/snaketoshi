export interface Square {
  number: number;
  title: string;
  sanskrit: string;
  meaning: string;
  reflection: string;
  video: string | null;
  snake: number | null;
  ladder: number | null;
}

export interface Player {
  id: string;
  name: string;
  color: string;
  position: number;
}

export interface GameLog {
  id: string;
  playerId: string;
  playerName: string;
  roll: number;
  fromSquare: number;
  toSquare: number;
  finalSquare?: number;
  hasSnake?: boolean;
  hasLadder?: boolean;
  timestamp: number;
}

export interface GameState {
  players: Player[];
  currentPlayerIndex: number;
  log: GameLog[];
  roomId?: string;
  isMultiplayer: boolean;
}
