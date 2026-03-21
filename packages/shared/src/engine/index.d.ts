import { GameState, PlayerId } from '../types';
export declare function createNewGame(id: string): GameState;
export declare function startGame(state: GameState): GameState;
export interface PlayerAction {
    type: 'PLAY_CARD' | 'RESOLVE_EFFECT';
    playerId: PlayerId;
    cardId?: string;
    payload?: any;
}
export declare function applyAction(state: GameState, action: PlayerAction): GameState;
