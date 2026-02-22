import { create } from 'zustand';
import { io, Socket } from 'socket.io-client';
import type { GameState, ClientToServerEvents, ServerToClientEvents } from './types';

interface GameStore {
  socket: Socket<ServerToClientEvents, ClientToServerEvents> | null;
  gameState: GameState | null;
  playerName: string;
  avatar: string;
  isConnecting: boolean;
  error: string | null;

  connect: () => void;
  setPlayerInfo: (name: string, avatar: string) => void;
  createRoom: () => void;
  joinRoom: (roomId: string) => void;
  startGame: () => void;
  playCard: (cardId: string, chosenColor?: any) => void;
  drawCard: () => void;
  callUno: () => void;
  addAI: () => void;
}

export const useGameStore = create<GameStore>((set, get) => ({
  socket: null,
  gameState: null,
  playerName: '',
  avatar: '👤',
  isConnecting: false,
  error: null,

  setPlayerInfo: (name, avatar) => set({ playerName: name, avatar }),

  connect: () => {
    if (get().socket) return;
    
    const socket = io();
    
    socket.on('gameStateUpdate', (state) => {
      set({ gameState: state });
    });

    socket.on('error', (message) => {
      set({ error: message });
      setTimeout(() => set({ error: null }), 3000);
    });

    set({ socket });
  },

  createRoom: () => {
    const { socket, playerName, avatar } = get();
    if (!socket) return;
    socket.emit('createRoom', playerName, avatar, (roomId) => {
      console.log('Room created:', roomId);
    });
  },

  joinRoom: (roomId) => {
    const { socket, playerName, avatar } = get();
    if (!socket) return;
    socket.emit('joinRoom', roomId, playerName, avatar, (success, message) => {
      if (!success) set({ error: message || 'Failed to join room' });
    });
  },

  startGame: () => {
    const { socket, gameState } = get();
    if (!socket || !gameState) return;
    socket.emit('startGame', gameState.roomId);
  },

  playCard: (cardId, chosenColor) => {
    const { socket, gameState } = get();
    if (!socket || !gameState) return;
    socket.emit('playCard', gameState.roomId, cardId, chosenColor);
  },

  drawCard: () => {
    const { socket, gameState } = get();
    if (!socket || !gameState) return;
    socket.emit('drawCard', gameState.roomId);
  },

  callUno: () => {
    const { socket, gameState } = get();
    if (!socket || !gameState) return;
    socket.emit('callUno', gameState.roomId);
  },

  addAI: () => {
    const { socket, gameState } = get();
    if (!socket || !gameState) return;
    socket.emit('addAI', gameState.roomId);
  },
}));
