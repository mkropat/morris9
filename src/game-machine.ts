import produce from 'immer';
import {BLACK, EMPTY, WHITE} from './symbols';
import {GameContext, PieceColor} from './types';
import {Machine, assign} from 'xstate';

const alphabet = 'abcdefghijklmnopqrstuvwxyz';

const defaultGameContext: GameContext = {
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
  context,
}: {
  color: PieceColor;
  context: GameContext;
}): boolean => {
  const positions = boardPositionsByValue(context, color);

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

const getColor = (context: GameContext, position: string): PieceColor => {
  const {color: trayColor, index} = parsePosition(position) as TrayPosition;
  if (trayColor) {
    switch (trayColor) {
      case BLACK:
        return context.blackTray[index];
      case WHITE:
        return context.whiteTray[index];
      default:
        throw new Error(`unrecognized color: ${trayColor.toString()}`);
    }
  }

  return context.board[position];
};

const setPosition = ({
  color,
  context,
  position,
}: {
  color: PieceColor;
  context: GameContext;
  position: string;
}) =>
  produce(context, (draftState) => {
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

const placePiece = (context: GameContext, action: PlaceAction): GameContext => {
  const {from, to} = action;
  const added = setPosition({
    context,
    color: getColor(context, from),
    position: to,
  });
  return setPosition({
    context: added,
    color: EMPTY,
    position: from,
  });
};

const arePlaceablePiecesInTrays = (context: GameContext) => {
  return context.blackTray.includes(BLACK) || context.whiteTray.includes(WHITE);
};

export const boardPositionsByValue = (
  context: GameContext,
  color: PieceColor,
): string[] =>
  Object.entries(context.board)
    .filter(([, positionValue]) => positionValue === color)
    .map(([position]) => position);

const initializeGame = (): GameContext => defaultGameContext;

const enumerateMoves = (context: GameContext): [string, string][] => {
  return [];
};

export const gameMachine = Machine<GameContext, any, any>(
  {
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
            actions: 'initializeGame',
          },
        },
      },
      phase1BlackTurn: {
        on: {
          PLACE: {target: 'phase1BlackTurnPlaced', actions: 'placePiece'},
        },
        meta: {
          canMoveBlackTray: true,
          currentPlayer: BLACK,
        },
      },
      phase1BlackTurnPlaced: {
        always: [
          {
            target: 'phase1BlackCapturePiece',
            cond: 'currentPlayerHasThreeInARow',
          },
          {
            target: 'phase2WhiteTurn',
            cond: 'noAvailableTrayMoves',
          },
          'phase1WhiteTurn',
        ],
        meta: {
          currentPlayer: BLACK,
        },
      },
      phase1BlackCapturePiece: {
        type: 'final',
      },
      phase1WhiteTurn: {
        on: {
          PLACE: {target: 'phase1WhiteTurnPlaced', actions: 'placePiece'},
        },
        meta: {
          canMoveWhiteTray: true,
          currentPlayer: WHITE,
        },
      },
      phase1WhiteTurnPlaced: {
        always: [
          {
            target: 'phase1WhiteCapturePiece',
            cond: 'currentPlayerHasThreeInARow',
          },
          {
            target: 'phase2BlackTurn',
            cond: 'noAvailableTrayMoves',
          },
          'phase1BlackTurn',
        ],
        meta: {
          currentPlayer: WHITE,
        },
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
  },
  {
    actions: {
      placePiece: assign((context: GameContext, action: PlaceAction) =>
        placePiece(context, action),
      ),
      initializeGame: assign(() => initializeGame()),
    },
    guards: {
      currentPlayerHasThreeInARow: (context: GameContext, _, {state}) =>
        areThreeInARow({
          context,
          color: (flatten1Level(state.meta) as any).currentPlayer,
        }),
      noAvailableTrayMoves: (context: GameContext) =>
        !arePlaceablePiecesInTrays(context),
    },
  },
);

const flatten1Level = (obj: object): object =>
  Object.assign({}, ...Object.values(obj));
