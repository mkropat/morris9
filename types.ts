import {BLACK, EMPTY, WHITE} from './symbols';

export interface Coordinates {
  x: number;
  y: number;
}

export type PieceColor = typeof BLACK | typeof EMPTY | typeof WHITE;
