import express from 'express';
import http from 'http';
import { Server, Socket } from 'socket.io';
import cors from 'cors';
import { GameState, createNewGame, startGame, applyAction, PlayerAction, Color } from '@sardegna/shared';
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

// Helper: check if active player is bot and take action
function handleBotTurn(gameId: string) {
  const game = games[gameId];
  if (!game || !game.activePlayerId) return;
  if (game.phase !== 'playing' && game.phase !== 'sentinel_reveal') return;

  const activePlayer = game.players.find((p: any) => p.id === game.activePlayerId);
  if (!activePlayer || !activePlayer.isBot) return;

  // It's a bot's turn! Wait a short delay to simulate "thinking", then play a card
  setTimeout(() => {
    // Re-fetch state in case it changed
    const currentGameState = games[gameId];
    if (!currentGameState) return;
    if (currentGameState.phase !== 'playing' && currentGameState.phase !== 'sentinel_reveal') return;
    
    const botPlayer = currentGameState.players.find((p: any) => p.id === currentGameState.activePlayerId);
    if (!botPlayer || !botPlayer.isBot) return;
    
    // Handle Sentinel Reveal phase
    if (currentGameState.phase === 'sentinel_reveal') {
       const action: PlayerAction = {
         type: 'SENTINEL_REVEAL',
         playerId: botPlayer.id,
         payload: { numCards: Math.random() > 0.5 ? 1 : 2 }
       };
       try {
         games[gameId] = applyAction(currentGameState, action);
         io.to(gameId).emit('gameStateUpdate', games[gameId]);
         handleBotTurn(gameId);
       } catch (err) {
         console.error("Bot action error:", err);
       }
       return;
    }

    // Choose a random available card
    if (botPlayer.availableCards.length > 0) {
      const randomCardIndex = Math.floor(Math.random() * botPlayer.availableCards.length);
      const chosenCard = botPlayer.availableCards[randomCardIndex];
      
      // Give bot a valid random target depending on card effect
      const payload: any = {};
      if (chosenCard.effectType === 'place_fort') {
          const fortIds = Object.keys(currentGameState.fortSpaces || {});
          payload.targetId = fortIds[Math.floor(Math.random() * fortIds.length)];
          payload.targetType = 'fortSpace';
      } else if (chosenCard.effectType !== 'sentinel') {
          const provIds = Object.keys(currentGameState.provinces || {});
          payload.targetId = provIds[Math.floor(Math.random() * provIds.length)];
          payload.targetType = 'province';
      }

      const action: PlayerAction = {
        type: 'PLAY_CARD',
        playerId: botPlayer.id,
        cardId: chosenCard.id,
        payload
      };
      
      try {
        games[gameId] = applyAction(currentGameState, action);
        io.to(gameId).emit('gameStateUpdate', games[gameId]);
        
        // After applying action, the turn might pass to another bot
        handleBotTurn(gameId);
      } catch (err) {
        console.error("Bot action error:", err);
      }
    }
  }, 1500); // 1.5s delay
}

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
    let player = game.players.find((p: any) => p.id === playerId);
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
        { id: 'c1', name: 'Priest', effectDescription: 'Place 1 Priest or Move 1 Priest up to 3 spaces', effectType: 'move_priest' },
        { id: 'c2', name: 'Sentinel', effectDescription: 'Score leftmost face-up Fort Card', effectType: 'sentinel' },
        { id: 'c3', name: 'Villager', effectDescription: 'Place 1 Villager', effectType: 'place_villager' },
        { id: 'c4', name: 'Village', effectDescription: 'Place 1 Village', effectType: 'place_village' },
        { id: 'c5', name: 'Ship', effectDescription: 'Place 1 Ship in a Harbor', effectType: 'place_ship' },
        { id: 'c6', name: 'Fort', effectDescription: 'Place 1 Fort on a Fort Space', effectType: 'place_fort' },
        { id: 'c7', name: 'Farmer', effectDescription: 'Take 1 Agriculture Token', effectType: 'take_token' }
      ];

      game.players.push({
        id: playerId,
        name: playerName,
        color,
        score: 0,
        availableCards: starterHand,
        playedCard: null,
        reserves: { priests: 1, villages: 4, villagers: 5, forts: 3, ships: 2 },
        tokens: { wheat: 0, wine: 0, olive: 0, thyme: 0, cheese: 0 },
        isBot: false
      });
      game.log.push(`${playerName} joined the game.`);
    }

    io.to(gameId).emit('gameStateUpdate', game);
  });
  
  // Add Bot Event
  socket.on('addBot', ({ gameId }) => {
    let game = games[gameId];
    if (!game) return;
    
    if (game.phase !== 'lobby') {
      socket.emit('error', { message: 'Game already in progress' });
      return;
    }
    if (game.players.length >= 4) {
      socket.emit('error', { message: 'Game is full' });
      return;
    }
    
    const botId = 'bot-' + Math.random().toString(36).substring(2, 6);
    const availableColors: Color[] = ['red', 'blue', 'yellow', 'green'];
    const usedColors = game.players.map((p: any) => p.color);
    const botColor = availableColors.find(c => !usedColors.includes(c)) || 'red';
    
    const starterHand = [
        { id: 'c1', name: 'Priest', effectDescription: 'Place 1 Priest or Move 1 Priest up to 3 spaces', effectType: 'move_priest' },
        { id: 'c2', name: 'Sentinel', effectDescription: 'Score leftmost face-up Fort Card', effectType: 'sentinel' },
        { id: 'c3', name: 'Villager', effectDescription: 'Place 1 Villager', effectType: 'place_villager' },
        { id: 'c4', name: 'Village', effectDescription: 'Place 1 Village', effectType: 'place_village' },
        { id: 'c5', name: 'Ship', effectDescription: 'Place 1 Ship in a Harbor', effectType: 'place_ship' },
        { id: 'c6', name: 'Fort', effectDescription: 'Place 1 Fort on a Fort Space', effectType: 'place_fort' },
        { id: 'c7', name: 'Farmer', effectDescription: 'Take 1 Agriculture Token', effectType: 'take_token' }
      ];

    game.players.push({
      id: botId,
      name: `Bot ${botId.substring(4)}`,
      color: botColor,
      score: 0,
      availableCards: starterHand,
      playedCard: null,
      reserves: { priests: 1, villages: 4, villagers: 5, forts: 3, ships: 2 },
      tokens: { wheat: 0, wine: 0, olive: 0, thyme: 0, cheese: 0 },
      isBot: true
    });
    
    game.log.push(`Bot joined the game.`);
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
      
      // Kick off bot turn if a bot is first
      handleBotTurn(gameId);
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
      
      // Kick off bot turn if the next player is a bot
      handleBotTurn(gameId);
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
