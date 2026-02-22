import express from 'express';
import { createServer as createViteServer } from 'vite';
import { Server } from 'socket.io';
import http from 'http';
import path from 'path';
import { fileURLToPath } from 'url';
import { GameState, Player, Card, CardColor, CardValue, GameMessage } from './src/types';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: '*',
  },
});

const PORT = 3000;

// Game State Storage
const rooms = new Map<string, GameState>();

// Helper functions for Game Logic
const generateDeck = (): Card[] => {
  const colors: CardColor[] = ['red', 'blue', 'green', 'yellow'];
  const values: CardValue[] = ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9', 'skip', 'reverse', 'draw2'];
  const deck: Card[] = [];
  let idCounter = 0;

  for (const color of colors) {
    for (const value of values) {
      deck.push({ id: `card-${idCounter++}`, color, value });
      if (value !== '0') {
        deck.push({ id: `card-${idCounter++}`, color, value });
      }
    }
  }

  for (let i = 0; i < 4; i++) {
    deck.push({ id: `card-${idCounter++}`, color: 'wild', value: 'wild' });
    deck.push({ id: `card-${idCounter++}`, color: 'wild', value: 'wild_draw4' });
  }

  return deck.sort(() => Math.random() - 0.5);
};

const drawCards = (deck: Card[], count: number, discardPile: Card[]): Card[] => {
  const drawn: Card[] = [];
  for (let i = 0; i < count; i++) {
    if (deck.length === 0) {
      if (discardPile.length <= 1) break; 
      const topCard = discardPile.pop()!;
      deck.push(...discardPile.sort(() => Math.random() - 0.5));
      discardPile.length = 0;
      discardPile.push(topCard);
    }
    if (deck.length > 0) {
      drawn.push(deck.pop()!);
    }
  }
  return drawn;
};

const isValidPlay = (card: Card, topCard: Card, currentColor: CardColor): boolean => {
  if (card.color === 'wild') return true;
  if (card.color === currentColor) return true;
  if (card.value === topCard.value) return true;
  return false;
};

const addMessage = (room: GameState, text: string) => {
  room.messages.push({
    id: Date.now().toString() + Math.random().toString(),
    text,
    timestamp: Date.now(),
  });
  if (room.messages.length > 50) room.messages.shift();
};

const nextTurn = (room: GameState, skip: boolean = false) => {
  let steps = skip ? 2 : 1;
  room.currentPlayerIndex = (room.currentPlayerIndex + (steps * room.direction) + room.players.length) % room.players.length;
};

const handleAITurn = (roomId: string) => {
  const room = rooms.get(roomId);
  if (!room || room.status !== 'playing') return;

  const currentPlayer = room.players[room.currentPlayerIndex];
  if (!currentPlayer.isAI) return;

  setTimeout(() => {
    const currentRoom = rooms.get(roomId);
    if (!currentRoom || currentRoom.status !== 'playing' || currentRoom.players[currentRoom.currentPlayerIndex].id !== currentPlayer.id) return;

    const topCard = currentRoom.discardPile[currentRoom.discardPile.length - 1];
    const validCards = currentPlayer.hand.filter(c => isValidPlay(c, topCard, currentRoom.currentColor));

    if (validCards.length > 0) {
      const cardToPlay = validCards[0];
      let chosenColor: CardColor | undefined;

      if (cardToPlay.color === 'wild') {
        const colorCounts = { red: 0, blue: 0, green: 0, yellow: 0 };
        currentPlayer.hand.forEach(c => {
          if (c.color !== 'wild') colorCounts[c.color as keyof typeof colorCounts]++;
        });
        chosenColor = (Object.keys(colorCounts) as CardColor[]).reduce((a, b) => colorCounts[a as keyof typeof colorCounts] > colorCounts[b as keyof typeof colorCounts] ? a : b);
        if (colorCounts[chosenColor as keyof typeof colorCounts] === 0) chosenColor = 'red';
      }

      playCardLogic(roomId, currentPlayer.id, cardToPlay.id, chosenColor);
    } else {
      drawCardLogic(roomId, currentPlayer.id);
    }
  }, 1500);
};

const playCardLogic = (roomId: string, playerId: string, cardId: string, chosenColor?: CardColor) => {
  const room = rooms.get(roomId);
  if (!room || room.status !== 'playing') return;

  const playerIndex = room.players.findIndex(p => p.id === playerId);
  if (playerIndex === -1 || playerIndex !== room.currentPlayerIndex) return;

  const player = room.players[playerIndex];
  const cardIndex = player.hand.findIndex(c => c.id === cardId);
  if (cardIndex === -1) return;

  const card = player.hand[cardIndex];
  const topCard = room.discardPile[room.discardPile.length - 1];

  if (!isValidPlay(card, topCard, room.currentColor)) return;

  player.hand.splice(cardIndex, 1);
  room.discardPile.push(card);
  room.currentColor = card.color === 'wild' ? (chosenColor || 'red') : card.color;

  addMessage(room, `${player.name} played ${card.color} ${card.value}`);

  if (player.hand.length === 1 && player.isAI) {
      player.hasCalledUno = true;
      addMessage(room, `${player.name} called UNO!`);
  }

  if (player.hand.length === 0) {
    room.status = 'finished';
    room.winner = player.id;
    addMessage(room, `${player.name} won the game!`);
    io.to(roomId).emit('gameStateUpdate', room);
    return;
  }

  let skipNext = false;
  if (card.value === 'skip') {
    skipNext = true;
    addMessage(room, `Next player is skipped!`);
  } else if (card.value === 'reverse') {
    room.direction *= -1;
    if (room.players.length === 2) skipNext = true;
    addMessage(room, `Direction reversed!`);
  } else if (card.value === 'draw2') {
    skipNext = true;
    const nextIndex = (room.currentPlayerIndex + room.direction + room.players.length) % room.players.length;
    const drawn = drawCards(room.deck, 2, room.discardPile);
    room.players[nextIndex].hand.push(...drawn);
    addMessage(room, `${room.players[nextIndex].name} draws 2 cards!`);
  } else if (card.value === 'wild_draw4') {
    skipNext = true;
    const nextIndex = (room.currentPlayerIndex + room.direction + room.players.length) % room.players.length;
    const drawn = drawCards(room.deck, 4, room.discardPile);
    room.players[nextIndex].hand.push(...drawn);
    addMessage(room, `${room.players[nextIndex].name} draws 4 cards!`);
  }

  player.hasCalledUno = false; 

  nextTurn(room, skipNext);
  io.to(roomId).emit('gameStateUpdate', room);

  if (room.players[room.currentPlayerIndex].isAI) {
    handleAITurn(roomId);
  }
};

const drawCardLogic = (roomId: string, playerId: string) => {
  const room = rooms.get(roomId);
  if (!room || room.status !== 'playing') return;

  const playerIndex = room.players.findIndex(p => p.id === playerId);
  if (playerIndex === -1 || playerIndex !== room.currentPlayerIndex) return;

  const player = room.players[playerIndex];
  const drawn = drawCards(room.deck, 1, room.discardPile);
  player.hand.push(...drawn);
  
  addMessage(room, `${player.name} drew a card.`);

  nextTurn(room);
  io.to(roomId).emit('gameStateUpdate', room);

  if (room.players[room.currentPlayerIndex].isAI) {
    handleAITurn(roomId);
  }
};

io.on('connection', (socket) => {
  socket.on('createRoom', (playerName, avatar, callback) => {
    const roomId = Math.random().toString(36).substring(2, 8).toUpperCase();
    const newRoom: GameState = {
      roomId,
      players: [{ id: socket.id, name: playerName, hand: [], isAI: false, hasCalledUno: false, avatar }],
      currentPlayerIndex: 0,
      direction: 1,
      deck: [],
      discardPile: [],
      currentColor: 'red',
      status: 'waiting',
      winner: null,
      messages: [],
    };
    rooms.set(roomId, newRoom);
    socket.join(roomId);
    callback(roomId);
    io.to(roomId).emit('gameStateUpdate', newRoom);
  });

  socket.on('joinRoom', (roomId, playerName, avatar, callback) => {
    const room = rooms.get(roomId);
    if (!room) {
      callback(false, 'Room not found');
      return;
    }
    if (room.status !== 'waiting') {
      callback(false, 'Game already started');
      return;
    }
    if (room.players.length >= 10) {
      callback(false, 'Room is full');
      return;
    }

    room.players.push({ id: socket.id, name: playerName, hand: [], isAI: false, hasCalledUno: false, avatar });
    socket.join(roomId);
    callback(true);
    io.to(roomId).emit('gameStateUpdate', room);
  });

  socket.on('addAI', (roomId) => {
    const room = rooms.get(roomId);
    if (room && room.status === 'waiting' && room.players.length < 10) {
      const aiId = `ai-${Math.random().toString(36).substring(2, 8)}`;
      room.players.push({ id: aiId, name: `Bot ${room.players.length}`, hand: [], isAI: true, hasCalledUno: false, avatar: '🤖' });
      io.to(roomId).emit('gameStateUpdate', room);
    }
  });

  socket.on('startGame', (roomId) => {
    const room = rooms.get(roomId);
    if (room && room.status === 'waiting' && room.players.length > 1) {
      room.deck = generateDeck();
      room.players.forEach(p => {
        p.hand = drawCards(room.deck, 7, room.discardPile);
      });
      
      let firstCard = room.deck.pop()!;
      while (firstCard.color === 'wild' || firstCard.value === 'skip' || firstCard.value === 'reverse' || firstCard.value === 'draw2') {
        room.deck.unshift(firstCard);
        firstCard = room.deck.pop()!;
      }
      room.discardPile.push(firstCard);
      room.currentColor = firstCard.color;
      room.status = 'playing';
      room.currentPlayerIndex = Math.floor(Math.random() * room.players.length);
      
      addMessage(room, `Game started! ${room.players[room.currentPlayerIndex].name} goes first.`);
      
      io.to(roomId).emit('gameStateUpdate', room);

      if (room.players[room.currentPlayerIndex].isAI) {
        handleAITurn(roomId);
      }
    }
  });

  socket.on('playCard', (roomId, cardId, chosenColor) => {
    playCardLogic(roomId, socket.id, cardId, chosenColor);
  });

  socket.on('drawCard', (roomId) => {
    drawCardLogic(roomId, socket.id);
  });

  socket.on('callUno', (roomId) => {
    const room = rooms.get(roomId);
    if (room && room.status === 'playing') {
      const player = room.players.find(p => p.id === socket.id);
      if (player && player.hand.length <= 2) {
        player.hasCalledUno = true;
        addMessage(room, `${player.name} called UNO!`);
        io.to(roomId).emit('gameStateUpdate', room);
      }
    }
  });

  socket.on('disconnect', () => {
    rooms.forEach((room, roomId) => {
      const playerIndex = room.players.findIndex(p => p.id === socket.id);
      if (playerIndex !== -1) {
        room.players.splice(playerIndex, 1);
        if (room.players.filter(p => !p.isAI).length === 0) {
          rooms.delete(roomId);
        } else {
          if (room.status === 'playing' && room.currentPlayerIndex >= room.players.length) {
            room.currentPlayerIndex = 0;
          }
          io.to(roomId).emit('gameStateUpdate', room);
        }
      }
    });
  });
});

async function startServer() {
  app.get('/api/health', (req, res) => {
    res.json({ status: 'ok' });
  });

  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static('dist'));
    app.get('*', (req, res) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  }

  server.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
