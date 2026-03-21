export type PlayerId = string;
export type Color = 'red' | 'blue' | 'yellow' | 'green';
export interface Player {
    id: PlayerId;
    name: string;
    color: Color;
    score: number;
    availableCards: CharacterCard[];
    playedCard: CharacterCard | null;
    reserves: {
        priests: number;
        villages: number;
        villagers: number;
        forts: number;
        ships: number;
    };
}
export type ResourceType = 'wheat' | 'wine_olive' | 'thyme_cheese';
export interface Province {
    id: string;
    name: string;
    resource: ResourceType;
    pieces: {
        playerId: PlayerId;
        type: 'priest' | 'village' | 'villager' | 'fort';
    }[];
    adjacentProvinces: string[];
    adjacentHarbors: string[];
    adjacentFortSpaces: string[];
}
export interface Harbor {
    id: string;
    ships: {
        playerId: PlayerId;
    }[];
    adjacentProvinces: string[];
}
export interface FortSpace {
    id: string;
    forts: {
        playerId: PlayerId;
    }[];
    adjacentProvinces: string[];
}
export interface CharacterCard {
    id: string;
    name: string;
    effectDescription: string;
    effectType: 'move_ship' | 'place_villager' | 'sentinel' | 'move_priest' | 'place_fort' | 'place_village' | string;
}
export interface FortCard {
    id: string;
    scoringProvinceIds: string[];
    imageUrl?: string;
}
export type GamePhase = 'lobby' | 'setup' | 'playing' | 'scoring' | 'finished';
export interface GameState {
    id: string;
    phase: GamePhase;
    players: Player[];
    activePlayerId: PlayerId | null;
    playerOrder: PlayerId[];
    provinces: Record<string, Province>;
    harbors: Record<string, Harbor>;
    fortSpaces: Record<string, FortSpace>;
    fortCardDeck: FortCard[];
    fortCardRow: FortCard[];
    faceUpFortCards: number;
    scoringEventsCount: number;
    isScoringInProgress: boolean;
    currentScoringProvinceIndex: number;
    log: string[];
}
