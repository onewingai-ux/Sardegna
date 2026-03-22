import { GameState, Player, PlayerId, CharacterCard, Province, GamePhase, FortCard, FortSpace } from '../types';

// The island of Sardegna is roughly rectangular with a north/south split.
// We assign exact topology matching the 16 regions.
const ISLAND_TOPOLOGY = [
  { id: 'p1', name: 'Sassari', resource: 'wine_olive', adj: ['p2', 'p5'] },
  { id: 'p2', name: 'Castelsardo', resource: 'thyme_cheese', adj: ['p1', 'p3', 'p5', 'p6'] },
  { id: 'p3', name: 'Olbia', resource: 'wine_olive', adj: ['p2', 'p4', 'p6'] },
  { id: 'p4', name: 'Alghero', resource: 'wine_olive', adj: ['p3', 'p7', 'p8'] },
  { id: 'p5', name: 'Bosa', resource: 'wheat', adj: ['p1', 'p2', 'p6', 'p9'] },
  { id: 'p6', name: 'Macomer', resource: 'thyme_cheese', adj: ['p2', 'p3', 'p5', 'p7', 'p9', 'p10'] },
  { id: 'p7', name: 'Nuoro', resource: 'wine_olive', adj: ['p4', 'p6', 'p8', 'p10'] },
  { id: 'p8', name: 'Dorgali', resource: 'thyme_cheese', adj: ['p4', 'p7', 'p11'] },
  { id: 'p9', name: 'Oristano', resource: 'wheat', adj: ['p5', 'p6', 'p10', 'p12'] },
  { id: 'p10', name: 'Sorgono', resource: 'wine_olive', adj: ['p6', 'p7', 'p9', 'p11', 'p12', 'p13'] },
  { id: 'p11', name: 'Lanusei', resource: 'thyme_cheese', adj: ['p8', 'p10', 'p13', 'p14'] },
  { id: 'p12', name: 'Iglesias', resource: 'wine_olive', adj: ['p9', 'p10', 'p13', 'p15'] },
  { id: 'p13', name: 'Sanluri', resource: 'thyme_cheese', adj: ['p10', 'p11', 'p12', 'p14', 'p15', 'p16'] },
  { id: 'p14', name: 'Muravera', resource: 'wine_olive', adj: ['p11', 'p13', 'p16'] },
  { id: 'p15', name: 'Carbonia', resource: 'wine_olive', adj: ['p12', 'p13', 'p16'] },
  { id: 'p16', name: 'Cagliari', resource: 'thyme_cheese', adj: ['p13', 'p14', 'p15'] }
];

const FORT_CONNECTIONS: Record<string, string[]> = {
  f1: ['p1', 'p2'],
  f2: ['p2', 'p3'],
  f3: ['p2', 'p3', 'p5'],
  f4: ['p3', 'p5'],
  f5: ['p1', 'p4'],
  f6: ['p1', 'p2', 'p4'],
  f7: ['p4', 'p2', 'p6', 'p7'],
  f8: ['p2', 'p5', 'p7'],
  f9: ['p5', 'p7', 'p8'],
  f10: ['p5', 'p7', 'p8'],
  f11: ['p4', 'p6'],
  f12: ['p6', 'p7', 'p9', 'p10'],
  f13: ['p7', 'p8', 'p10'],
  f14: ['p8', 'p10'],
  f15: ['p6', 'p9'],
  f16: ['p9', 'p10', 'p12', 'p13'],
  f17: ['p10', 'p13'],
  f18: ['p9', 'p11'],
  f19: ['p9', 'p11', 'p12'],
  f20: ['p12', 'p13', 'p16'],
  f21: ['p13', 'p16'],
  f22: ['p11', 'p14'],
  f23: ['p14', 'p11', 'p15'],
  f24: ['p11', 'p12', 'p15'],
  f25: ['p16', 'p12', 'p15'],
  f26: ['p14', 'p15'],
};


export function createNewGame(id: string): GameState {
  
  const provinces: Record<string, Province> = {};
  
  ISLAND_TOPOLOGY.forEach(t => {
    provinces[t.id] = {
      id: t.id,
      name: t.name,
      resource: t.resource as any,
      pieces: [],
      adjacentProvinces: t.adj,
      adjacentHarbors: [],
      adjacentFortSpaces: []
    };
  });

  const fortSpaces: Record<string, FortSpace> = {};
  for (const [fId, pIds] of Object.entries(FORT_CONNECTIONS)) {
    fortSpaces[fId] = {
      id: fId,
      forts: [],
      adjacentProvinces: pIds
    };
    pIds.forEach(pId => {
      if(provinces[pId]) {
        provinces[pId].adjacentFortSpaces.push(fId);
      }
    });
  }


  return {
    id,
    phase: 'lobby',
    players: [],
    activePlayerId: null,
    playerOrder: [],
    provinces,
    harbors: {},
    fortSpaces,
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
  
  // Create 26 fort cards corresponding to the 26 forts
  const allFortCards: FortCard[] = Object.entries(FORT_CONNECTIONS).map(([fId, pIds]) => ({
    id: fId,
    scoringProvinceIds: [...pIds]
  }));

  // Shuffle the deck (simple Fisher-Yates for MVP)
  for (let i = allFortCards.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [allFortCards[i], allFortCards[j]] = [allFortCards[j], allFortCards[i]];
  }

  // Deal 11 to the row, rest to deck
  state.fortCardRow = allFortCards.slice(0, 11);
  state.fortCardDeck = allFortCards.slice(11);
  state.faceUpFortCards = 2;
  
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

    if (card.effectType === 'sentinel') {
      return triggerSentinel(state);
    }

    if (action.payload && action.payload.targetId) {
      const { targetId, targetType } = action.payload;
      
      if (targetType === 'province' && state.provinces[targetId]) {
         const typeMap: Record<string, 'villager' | 'village' | 'priest'> = {
           'place_villager': 'villager',
           'place_village': 'village',
           'move_priest': 'priest'
         };
         const pieceType = typeMap[card.effectType] || 'villager';
         
         state.provinces[targetId].pieces.push({
           playerId: player.id,
           type: pieceType
         });
         state.log.push(`${player.name} placed a ${pieceType} in ${state.provinces[targetId].name}`);
      } else if (targetType === 'fortSpace' && state.fortSpaces[targetId] && card.effectType === 'place_fort') {
         state.fortSpaces[targetId].forts.push({
           playerId: player.id
         });
         state.log.push(`${player.name} placed a fort at ${targetId}`);
      }
    } else {
       // Fallback for bot or error
       state.log.push(`${player.name} played ${card.name} but no valid target was provided.`);
    }

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
