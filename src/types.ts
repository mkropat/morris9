import {PieceColor} from './symbols';

export interface Coordinates {
  x: number;
  y: number;
}

export interface GameContext {
  board: Record<string, PieceColor>;
  blackTray: PieceColor[];
  whiteTray: PieceColor[];
}

export {PieceColor};
