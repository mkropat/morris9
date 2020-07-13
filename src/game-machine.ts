import produce from 'immer';
import {BLACK, EMPTY, WHITE} from './symbols';
import {GameState, PieceColor} from './types';
import {Machine, assign} from 'xstate';

const alphabet = 'abcdefghijklmnopqrstuvwxyz';

const defaultGameState: GameState = {
  board: {
    a1: EMPTY,
    d1: EMPTY,
    g1: EMPTY,
    b2: EMPTY,
    d2: EMPTY,
    f2: EMPTY,
    c3: EMPTY,
    d3: EMPTY,
    e3: EMPTY,
    a4: EMPTY,
    b4: EMPTY,
    c4: EMPTY,
    e4: EMPTY,
    f4: EMPTY,
    g4: EMPTY,
    c5: EMPTY,
    d5: EMPTY,
    e5: EMPTY,
    b6: EMPTY,
    d6: EMPTY,
    f6: EMPTY,
    a7: EMPTY,
    d7: EMPTY,
    g7: EMPTY,
  },
  blackTray: [BLACK, BLACK, BLACK, BLACK, BLACK, BLACK, BLACK, BLACK, BLACK],
  whiteTray: [WHITE, WHITE, WHITE, WHITE, WHITE, WHITE, WHITE, WHITE, WHITE],
};

export const areThreeInARow = ({
  color,
  state,
}: {
  color: PieceColor;
  state: GameState;
}): boolean => {
  const positions = boardPositionsByValue(state, color);

  const byCols: Record<number, string[]> = {};
  const byRows: Record<number, string[]> = {};
  for (const p of positions) {
    const {col, row} = parsePosition(p) as BoardPosition;

    byCols[col] = byCols[col] || [];
    byCols[col].push(p);

    byRows[row] = byRows[row] || [];
    byRows[row].push(p);
  }

  return (
    Object.values(byCols).some((ps) => ps.length >= 3) ||
    Object.values(byRows).some((ps) => ps.length >= 3)
  );
};

const positionPrefixToTray: Record<string, PieceColor> = {
  bt: BLACK,
  wt: WHITE,
};

export interface BoardPosition {
  col: number;
  row: number;
  position: string;
}

export interface TrayPosition {
  color: PieceColor;
  index: number;
  position: string;
}

export const parsePosition = (
  position: string,
): BoardPosition | TrayPosition => {
  const prefixMatch = position.match(/^\D*/);
  const letters = prefixMatch ? prefixMatch[0] : '';
  const numbers = position.substring(letters.length);
  const trayColor = positionPrefixToTray[letters];

  if (trayColor) {
    return {
      color: trayColor,
      index: parseInt(numbers, 10),
      position,
    };
  }

  return {
    col: alphabet.indexOf(letters),
    position,
    row: parseInt(numbers, 10) - 1,
  };
};

interface PlaceAction {
  type: 'PLACE';
  from: string;
  to: string;
}

const getColor = (state: GameState, position: string): PieceColor => {
  const {color: trayColor, index} = parsePosition(position) as TrayPosition;
  if (trayColor) {
    switch (trayColor) {
      case BLACK:
        return state.blackTray[index];
      case WHITE:
        return state.whiteTray[index];
      default:
        throw new Error(`unrecognized color: ${trayColor.toString()}`);
    }
  }

  return state.board[position];
};

const setPosition = ({
  color,
  state,
  position,
}: {
  color: PieceColor;
  state: GameState;
  position: string;
}) =>
  produce(state, (draftState) => {
    const {color: trayColor, index} = parsePosition(position) as TrayPosition;

    if (trayColor) {
      switch (trayColor) {
        case BLACK:
          draftState.blackTray[index] = color;
          break;
        case WHITE:
          draftState.whiteTray[index] = color;
          break;
        default:
          throw new Error(`unrecognized color: ${trayColor.toString()}`);
      }
    } else {
      draftState.board[position] = color;
    }
  });

const placePiece = (state: GameState, action: PlaceAction) => {
  const {from, to} = action;
  const added = setPosition({
    state,
    color: getColor(state, from),
    position: to,
  });
  return setPosition({
    state: added,
    color: EMPTY,
    position: from,
  });
};

const arePlaceablePiecesInTrays = (state: GameState) => {
  return state.blackTray.includes(BLACK) || state.whiteTray.includes(WHITE);
};

export const boardPositionsByValue = (
  state: GameState,
  color: PieceColor,
): string[] =>
  Object.entries(state.board)
    .filter(([, positionValue]) => positionValue === color)
    .map(([position]) => position);

const initializeGame = (): GameState => defaultGameState;

export const gameMachine = Machine<GameState, any, any>({
  id: 'morris9',
  initial: 'start',
  context: {
    board: {},
    blackTray: [],
    whiteTray: [],
  },
  states: {
    start: {
      on: {
        NEW_GAME: {
          target: 'phase1BlackTurn',
          actions: [assign(initializeGame)],
        },
      },
    },
    phase1BlackTurn: {
      on: {
        PLACE: {target: 'phase1BlackTurnPlaced', actions: [assign(placePiece)]},
      },
      meta: {
        canMoveBlackTray: true,
      },
    },
    phase1BlackTurnPlaced: {
      always: [
        {
          target: 'phase1BlackCapturePiece',
          cond: (state: GameState) => areThreeInARow({state, color: BLACK}),
        },
        {
          target: 'phase2WhiteTurn',
          cond: (state: GameState) => !arePlaceablePiecesInTrays(state),
        },
        'phase1WhiteTurn',
      ],
    },
    phase1BlackCapturePiece: {
      type: 'final',
    },
    phase1WhiteTurn: {
      on: {
        PLACE: {target: 'phase1WhiteTurnPlaced', actions: [assign(placePiece)]},
      },
      meta: {
        canMoveWhiteTray: true,
      },
    },
    phase1WhiteTurnPlaced: {
      always: [
        {
          target: 'phase1WhiteCapturePiece',
          cond: (state: GameState) => areThreeInARow({state, color: WHITE}),
        },
        {
          target: 'phase2BlackTurn',
          cond: (state: GameState) => !arePlaceablePiecesInTrays(state),
        },
        'phase1BlackTurn',
      ],
    },
    phase1WhiteCapturePiece: {
      type: 'final',
    },
    phase2BlackTurn: {
      type: 'final',
    },
    phase2WhiteTurn: {
      type: 'final',
    },
  },
});
