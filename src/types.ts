import {BLACK, EMPTY, WHITE} from './symbols';

export interface Coordinates {
  x: number;
  y: number;
}

export interface GameState {
  board: Record<string, PieceColor>;
  blackTray: PieceColor[];
  whiteTray: PieceColor[];
}

export type PieceColor = typeof BLACK | typeof EMPTY | typeof WHITE;
