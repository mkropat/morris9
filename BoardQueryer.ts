import {BLACK, EMPTY, WHITE} from './symbols';
import {Coordinates} from './types';
import {addCoordinates, getDistance} from './coordinates';

const boardHorizontalMarginPx = 60;
const boardVerticalMarginPx = 57;
const boardNaturalHeightPx = 818;
const boardNaturalWidthPx = 818;
const boardPositionSpacingPx = 117;

class BoardQueryer {
  _numVerticalPositions?: number;
  _offset: Coordinates;
  _state: Record<string, symbol>;
  _size: number;
  _xyCache: Record<string, Coordinates> = {};

  constructor({
    boardPosition,
    boardSize,
    boardState,
  }: {
    boardPosition: Coordinates;
    boardSize: number;
    boardState: Record<string, symbol>;
  }) {
    this._offset = boardPosition;
    this._size = boardSize;
    this._state = boardState;
  }

  get allPositions(): string[] {
    return Object.keys(this._state);
  }

  get blackPositions(): string[] {
    return this._getPositionByValue(BLACK);
  }

  get emptyPositions(): string[] {
    return this._getPositionByValue(EMPTY);
  }

  get whitePositions(): string[] {
    return this._getPositionByValue(WHITE);
  }

  nearestEmpty({x, y}: Coordinates) {
    const withDistance = this.emptyPositions.map((position) => ({
      position,
      ...this.xyForPosition(position),
      distance: getDistance({x, y}, this.pageXyForPosition(position)),
    }));
    withDistance.sort((l, r) => l.distance - r.distance);
    return withDistance[0];
  }

  get numVerticalPositions(): number {
    if (!this._numVerticalPositions) {
      const ys = this.allPositions.map(positionToLogicalXy).map(({y}) => y);
      this._numVerticalPositions = new Set(ys).size;
    }
    return this._numVerticalPositions;
  }

  pageXyForPosition(position: string): Coordinates {
    return addCoordinates(this._offset, this.xyForPosition(position));
  }

  xyForPosition(position: string): Coordinates {
    if (!this._xyCache[position]) {
      const {x: logicalX, y: logicalY} = positionToLogicalXy(position);

      const horizontalScaleFactor = this._size / boardNaturalWidthPx;
      const x =
        horizontalScaleFactor *
        (boardHorizontalMarginPx + boardPositionSpacingPx * logicalX);

      const verticalScaleFactor = this._size / boardNaturalHeightPx;
      const y =
        verticalScaleFactor *
        (boardVerticalMarginPx +
          boardPositionSpacingPx * (this.numVerticalPositions - 1 - logicalY));

      this._xyCache[position] = {x, y};
    }
    return this._xyCache[position];
  }

  _getPositionByValue(value: symbol) {
    return Object.entries(this._state)
      .filter(([, positionValue]) => positionValue === value)
      .map(([position]) => position);
  }
}

export default BoardQueryer;

const alphabet = 'abcdefghijklmnopqrstuvwxyz';

const positionToLogicalXy = (position: string): Coordinates => {
  const [col, row] = position;
  return {x: alphabet.indexOf(col), y: parseInt(row, 10) - 1};
};
