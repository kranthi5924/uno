export type CardColor = 'red' | 'blue' | 'green' | 'yellow' | 'wild';
export type CardValue = '0' | '1' | '2' | '3' | '4' | '5' | '6' | '7' | '8' | '9' | 'skip' | 'reverse' | 'draw2' | 'wild' | 'wild_draw4';

export interface Card {
  id: string;
  color: CardColor;
  value: CardValue;
}

export interface Player {
  id: string;
  name: string;
  hand: Card[];
  isAI: boolean;
  hasCalledUno: boolean;
  avatar: string;
}

export interface GameState {
  roomId: string;
  players: Player[];
  currentPlayerIndex: number;
  direction: 1 | -1;
  deck: Card[];
  discardPile: Card[];
  currentColor: CardColor;
  status: 'waiting' | 'playing' | 'finished';
  winner: string | null;
  messages: GameMessage[];
}

export interface GameMessage {
  id: string;
  text: string;
  timestamp: number;
}

// Socket Events
export interface ServerToClientEvents {
  gameStateUpdate: (state: GameState) => void;
  error: (message: string) => void;
  playerJoined: (player: Player) => void;
  playerLeft: (playerId: string) => void;
}

export interface ClientToServerEvents {
  createRoom: (playerName: string, avatar: string, callback: (roomId: string) => void) => void;
  joinRoom: (roomId: string, playerName: string, avatar: string, callback: (success: boolean, message?: string) => void) => void;
  startGame: (roomId: string) => void;
  playCard: (roomId: string, cardId: string, chosenColor?: CardColor) => void;
  drawCard: (roomId: string) => void;
  callUno: (roomId: string) => void;
  addAI: (roomId: string) => void;
}
