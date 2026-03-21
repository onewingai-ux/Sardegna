import { GameState, Player, PlayerId, CharacterCard, Province, GamePhase, FortCard } from '../types';

export function createNewGame(id: string): GameState {
  
  // Scaffolding a basic 4x4 grid representation for the 16 provinces
  const provinces: Record<string, Province> = {};
  for (let i = 0; i < 16; i++) {
    const id = `p${i + 1}`;
    let resource: 'wheat' | 'wine_olive' | 'thyme_cheese' = 'thyme_cheese';
    if (i < 2) resource = 'wheat';
    else if (i < 10) resource = 'wine_olive';
    
    provinces[id] = {
      id,
      name: `Province ${i + 1}`,
      resource,
      pieces: [],
      adjacentProvinces: [],
      adjacentHarbors: [],
      adjacentFortSpaces: []
    };
  }

  return {
    id,
    phase: 'lobby',
    players: [],
    activePlayerId: null,
    playerOrder: [],
    provinces,
    harbors: {},
    fortSpaces: {},
    fortCardDeck: [], // Shuffled 26
    fortCardRow: [], // Dealt 11
    faceUpFortCards: 2,
    scoringEventsCount: 0,
    isScoringInProgress: false,
    currentScoringProvinceIndex: 0,
    log: []
  };
}

export function startGame(state: GameState): GameState {
  if (state.players.length < 2) throw new Error("Not enough players");
  state.phase = 'playing';
  state.activePlayerId = state.players[0].id;
  state.playerOrder = state.players.map(p => p.id);
  
  // Setup logic: shuffle deck, deal 11 to row, face up 2, etc.
  for (let i = 0; i < 11; i++) {
    state.fortCardRow.push({
      id: `fc${i + 1}`,
      scoringProvinceIds: [`p${(i % 16) + 1}`, `p${((i+1) % 16) + 1}`]
    });
  }
  
  return state;
}

export interface PlayerAction {
  type: 'PLAY_CARD' | 'RESOLVE_EFFECT';
  playerId: PlayerId;
  cardId?: string;
  // Payload would contain details like 'targetProvinceId', 'targetHarborId' based on effect type
  payload?: any;
}

export function applyAction(state: GameState, action: PlayerAction): GameState {
  if (state.phase !== 'playing' && state.phase !== 'scoring') {
    throw new Error(`Cannot perform actions in phase ${state.phase}`);
  }
  if (action.playerId !== state.activePlayerId) {
    throw new Error("Not active player's turn");
  }

  if (action.type === 'PLAY_CARD') {
    const player = state.players.find(p => p.id === action.playerId);
    if (!player) throw new Error("Player not found");
    const cardIndex = player.availableCards.findIndex(c => c.id === action.cardId);
    
    if (cardIndex === -1) throw new Error("Card not found in hand");

    const card = player.availableCards.splice(cardIndex, 1)[0];
    player.playedCard = card;
    
    state.log.push(`Player ${player.name} played ${card.name}`);

    // Let's add a fake piece placement so the board changes visually
    const randomProvince = `p${Math.floor(Math.random() * 16) + 1}`;
    state.provinces[randomProvince].pieces.push({
      playerId: player.id,
      type: 'villager'
    });
    state.log.push(`${player.name} placed a villager in Province ${randomProvince.substring(1)}`);

    // Immediately resolve Sentinel
    if (card.effectType === 'sentinel') {
      return triggerSentinel(state);
    }
    
    // For other cards, a real engine would wait for subsequent payload actions, but for the MVP skeleton:
    // It's assumed the client sends RESOLVE_EFFECT next, or combined PLAY_CARD with payload.
    nextTurn(state);
  }

  return state;
}

function nextTurn(state: GameState) {
  if (!state.activePlayerId) return;
  const currentIndex = state.playerOrder.indexOf(state.activePlayerId);
  state.activePlayerId = state.playerOrder[(currentIndex + 1) % state.playerOrder.length];
}

function triggerSentinel(state: GameState): GameState {
  state.phase = 'scoring';
  state.isScoringInProgress = true;
  state.currentScoringProvinceIndex = 0;
  
  if (state.fortCardRow.length === 0) {
     throw new Error("No fort cards left to score");
  }
  
  const scoringCard = state.fortCardRow[0];
  state.log.push(`Scoring triggered based on fort card ${scoringCard.id}`);
  
  // Actually score it
  scoreFortCard(state, scoringCard);

  // After scoring:
  state.scoringEventsCount++;
  
  if (state.scoringEventsCount >= 11) {
    state.phase = 'finished';
    state.log.push("Game Over! 11th scoring event completed.");
    return state;
  }

  // Retrieve cards for all players
  state.players.forEach(p => {
    if (p.playedCard) {
      p.availableCards.push(p.playedCard);
      p.playedCard = null;
    }
  });

  // Discard leftmost, reveal next
  const discarded = state.fortCardRow.shift();
  if (discarded) state.fortCardDeck.push(discarded);
  
  state.phase = 'playing';
  state.isScoringInProgress = false;
  nextTurn(state);
  
  return state;
}

function scoreFortCard(state: GameState, fortCard: FortCard) {
  // Skeleton for scoring a fort card's provinces
  // 1. Iterate over fortCard.scoringProvinceIds
  // 2. For each province, tally influence:
  //    - villager: 1
  //    - village: 2
  //    - priest: 3
  //    - forts adjacent: 2
  //    - ships adjacent harbor: 1
  // 3. Assign VP (e.g., 4 VP first place, 2 VP second place, etc)
  // 4. Update player scores
}
