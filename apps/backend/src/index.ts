import express from 'express';
import http from 'http';
import { Server, Socket } from 'socket.io';
import cors from 'cors';
import { GameState, createNewGame, startGame, applyAction, PlayerAction } from '@sardegna/shared';
import path from 'path';

const app = express();
const server = http.createServer(app);

// Use wildcard cors for MVP
const io = new Server(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST']
  }
});

app.use(cors());
app.use(express.json());

// In-memory store
const games: Record<string, GameState> = {};

// REST Endpoints
app.post('/api/games', (req, res) => {
  const gameId = Math.random().toString(36).substring(2, 8);
  const newGame = createNewGame(gameId);
  games[gameId] = newGame;
  res.json({ gameId });
});

app.get('/api/games/:id', (req, res) => {
  const game = games[req.params.id];
  if (!game) return res.status(404).json({ error: 'Game not found' });
  res.json(game);
});

// WebSocket Logic
io.on('connection', (socket: Socket) => {
  console.log(`User connected: ${socket.id}`);

  socket.on('joinGame', ({ gameId, playerId, playerName, color }) => {
    let game = games[gameId];
    if (!game) {
      socket.emit('error', { message: 'Game not found' });
      return;
    }

    socket.join(gameId);

    // If player doesn't exist, try to add them
    let player = game.players.find(p => p.id === playerId);
    if (!player) {
      if (game.phase !== 'lobby') {
        socket.emit('error', { message: 'Game already in progress' });
        return;
      }
      if (game.players.length >= 4) {
        socket.emit('error', { message: 'Game is full' });
        return;
      }
      
      // Starter hand skeleton
      const starterHand = [
        { id: 'c1', name: 'Priest', effectDescription: 'Move priest', effectType: 'move_priest' },
        { id: 'c2', name: 'Sentinel', effectDescription: 'Score Fort', effectType: 'sentinel' }
        // ... 5 more cards
      ];

      game.players.push({
        id: playerId,
        name: playerName,
        color,
        score: 0,
        availableCards: starterHand,
        playedCard: null,
        reserves: { priests: 1, villages: 4, villagers: 5, forts: 3, ships: 2 }
      });
      game.log.push(`${playerName} joined the game.`);
    }

    io.to(gameId).emit('gameStateUpdate', game);
  });

  socket.on('startGame', ({ gameId, playerId }) => {
    let game = games[gameId];
    if (!game) return;
    
    // In a real game, restrict to host. For MVP, anyone can start if enough players.
    try {
      game = startGame(game);
      game.log.push('Game started!');
      io.to(gameId).emit('gameStateUpdate', game);
    } catch (err: any) {
      socket.emit('error', { message: err.message });
    }
  });

  socket.on('playerAction', ({ gameId, action }: { gameId: string, action: PlayerAction }) => {
    let game = games[gameId];
    if (!game) return;

    try {
      game = applyAction(game, action);
      io.to(gameId).emit('gameStateUpdate', game);
    } catch (err: any) {
      socket.emit('error', { message: err.message });
    }
  });

  socket.on('disconnect', () => {
    console.log(`User disconnected: ${socket.id}`);
  });
});

// Serve static frontend files in production
if (process.env.NODE_ENV === 'production') {
  const frontendDistPath = path.join(__dirname, '../../frontend/dist');
  app.use(express.static(frontendDistPath));

  app.get('*', (req, res) => {
    res.sendFile(path.join(frontendDistPath, 'index.html'));
  });
}

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`Backend server running on port ${PORT}`);
});
