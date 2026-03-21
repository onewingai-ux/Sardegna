# Sardegna Multiplayer

A web-based multiplayer implementation of the board game **Sardegna**.
Optimized for deployment on Railway as a single container.

## Architecture Overview

This project uses an authoritative server architecture housed in an npm workspace (monorepo).

- **`packages/shared`:** Contains the game definitions, types, board models, and the pure, side-effect-free **Core Rules Engine**. The engine takes a `GameState` and an `Action`, and returns a modified `GameState`.
- **`apps/backend`:** An Express + Socket.io server running Node.js. It maintains the authoritative, in-memory `games` state. It handles REST endpoints (for game creation/joining) and WebSocket events (for pushing state updates and receiving actions). In production, it statically serves the frontend build.
- **`apps/frontend`:** A React SPA built with Vite and Tailwind CSS. It communicates with the backend via WebSocket, rendering the current game state (Board, Scores, Hand, Action Log) and dispatching user intents.

## Game State & Data Model

The core `GameState` includes:
- **Players:** Arrays containing score, reserved pieces, available character cards, and the currently played card.
- **Board Topology:** Dictionaries for `Province`, `Harbor`, and `FortSpace`. Each tracks its contents (pieces, resource type) and graph adjacencies.
- **Fort Deck Management:** Keeps track of the `fortCardDeck`, the dealt `fortCardRow`, and the current scoring limit limit (`scoringEventsCount`, max 11).

## Core Rules Engine: The Sentinel Trigger

When a player plays a card, the engine handles it based on `effectType`.
If the played card is a **Sentinel**:
1. The game `phase` shifts to `'scoring'`.
2. The `scoreFortCard` logic triggers for the leftmost card in the `fortCardRow`.
3. It resolves influence on the target provinces based on standard rules (priests: 3, villages: 2, etc.), assigning VPs.
4. The `scoringEventsCount` increments. If it hits 11, the game ends.
5. All players immediately retrieve their played cards back into `availableCards`.
6. The scored fort card is shifted out and appended back to the `fortCardDeck`. The next card in the row is revealed if necessary.

## API Design

### REST
- `POST /api/games`: Returns `{ gameId }`.
- `GET /api/games/:id`: Fetches the current snapshot for a given `gameId`.

### WebSocket Events
**Client to Server:**
- `joinGame(gameId, playerId, playerName, color)`: Joins the game room.
- `startGame(gameId, playerId)`: Transitions the game from `lobby` to `playing`.
- `playerAction(gameId, action)`: Dispatches intents like `PLAY_CARD` with `{ cardId, payload }`.

**Server to Client:**
- `gameStateUpdate(state)`: Broadcasted after any successful action or state change.
- `error({ message })`: Sent specifically to a client if their action is invalid or out-of-turn.

## Running the MVP Locally

\`\`\`bash
# Install dependencies across workspaces
npm install

# Run backend (dev mode)
npm run dev -w @sardegna/backend

# Run frontend (in another terminal)
npm run dev -w @sardegna/frontend
\`\`\`

## Deployment (Railway)

The included `Dockerfile` builds all packages, packages the frontend bundle into the backend dist directory, and spins up the Node server on port 8080.
Just link this repo to a Railway project, and it will deploy seamlessly.

