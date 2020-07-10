import BoardQueryer from './BoardQueryer';
import {useImmer} from 'use-immer';
import React, {useRef, useState} from 'react';
import {
  Dimensions,
  Image,
  SafeAreaView,
  StyleSheet,
  StatusBar,
  Text,
  View,
} from 'react-native';
import {BLACK, EMPTY, WHITE} from './symbols';
import {BlackPiece, Piece, pieceSizePx, WhitePiece} from './pieces';

const boardImage = require('./board.png');

interface GameState {
  board: Record<string, symbol>;
  blackTray: symbol[];
  whiteTray: symbol[];
}

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

interface PlaceholderState {
  color: symbol | null;
  position: string | null;
}

const App = () => {
  const boardRef = useRef(null);
  const boardPosition = useRef({x: 0, y: 0}).current;
  const [{board: boardState, blackTray, whiteTray}, updateGameState] = useImmer(
    defaultGameState,
  );
  const [
    {color: placeholderColor, position: placeholderPosition},
    setPlaceholderState,
  ] = useState<PlaceholderState>({color: null, position: null});

  const {height: windowHeight, width: windowWidth} = Dimensions.get('window');
  const boardSize = Math.min(windowHeight, windowWidth);

  const board = new BoardQueryer({
    boardPosition,
    boardSize,
    boardState,
  });

  const handleMove = (from: string, to: string) => {
    updateGameState((draftState) => {
      setPosition({
        state: draftState,
        color: getPositionColor(draftState, from),
        position: to,
      });
      setPosition({
        state: draftState,
        color: EMPTY,
        position: from,
      });
    });
  };

  const updateBoardPosition = (
    x: number,
    y: number,
    width: number,
    height: number,
    pageX: number,
    pageY: number,
  ) => {
    boardPosition.x = pageX;
    boardPosition.y = pageY;
  };

  return (
    <>
      <StatusBar />
      <SafeAreaView>
        <Text style={styles.title}>Nine Men’s Morris</Text>
        <View
          onLayout={() =>
            (boardRef.current as any)?.measure(updateBoardPosition)
          }
          ref={boardRef}>
          <Board boardSize={boardSize}>
            {board.blackPositions.map((pos) => (
              <BlackPiece
                key={pos}
                board={board}
                id={pos}
                xy={board.xyForPosition(pos)}
              />
            ))}
            {board.whitePositions.map((pos) => (
              <WhitePiece
                key={pos}
                board={board}
                id={pos}
                xy={board.xyForPosition(pos)}
              />
            ))}
          </Board>
          {placeholderColor && placeholderPosition && (
            <Piece
              board={board}
              color={placeholderColor}
              placeholder
              xy={board.xyForPosition(placeholderPosition)}
            />
          )}
        </View>
        <View style={styles.trayContainer}>
          <PieceTray
            board={board}
            movable
            onMove={handleMove}
            pieces={blackTray}
            prefix="bt"
            setPlaceholderState={setPlaceholderState}
          />
          <PieceTray
            board={board}
            onMove={handleMove}
            pieces={whiteTray}
            prefix="wt"
            setPlaceholderState={setPlaceholderState}
          />
        </View>
      </SafeAreaView>
    </>
  );
};

const pieceTrayWidthPx = 150;

const PieceTray = ({
  board,
  movable = false,
  onMove,
  pieces,
  prefix,
  setPlaceholderState,
}: {
  board: BoardQueryer;
  movable?: boolean;
  onMove?: (from: string, to: string) => void;
  pieces: symbol[];
  prefix: string;
  setPlaceholderState: ({}: {color: symbol; position: string | null}) => void;
}) => {
  const numPiecesPerRow = Math.floor(pieceTrayWidthPx / pieceSizePx);

  const getXy = (i: number) => {
    const col = i % numPiecesPerRow;
    const row = Math.floor(i / numPiecesPerRow);
    return {
      x: col * pieceSizePx + pieceSizePx / 2,
      y: row * pieceSizePx + pieceSizePx / 2,
    };
  };

  return (
    <View style={[styles.pieceTray]}>
      {pieces.map(
        (piece, i) =>
          piece !== EMPTY && (
            <Piece
              key={i}
              board={board}
              color={piece}
              id={`${prefix}${i}`}
              movable={movable}
              onHover={setPlaceholderState}
              onMove={onMove}
              xy={getXy(i)}
            />
          ),
      )}
    </View>
  );
};

export default App;

const Board = ({
  boardSize,
  children,
}: {
  boardSize: number;
  children: React.ReactNode;
}) => (
  <>
    <Image
      source={boardImage}
      style={[styles.board, {height: boardSize, width: boardSize}]}
    />
    {children}
  </>
);

const getPositionColor = (state: GameState, position: string): symbol => {
  const i = parseInt(position.replace(/\D/g, ''), 10);
  const {blackTray, board, whiteTray} = state;

  if (position.startsWith('bt')) {
    return blackTray[i];
  }
  if (position.startsWith('wt')) {
    return whiteTray[i];
  }
  return board[position];
};

const setPosition = ({
  color,
  state,
  position,
}: {
  color: symbol;
  state: GameState;
  position: string;
}) => {
  const i = parseInt(position.replace(/\D/g, ''), 10);

  if (position.startsWith('bt')) {
    state.blackTray[i] = color;
  } else if (position.startsWith('wt')) {
    state.whiteTray[i] = color;
  } else {
    state.board[position] = color;
  }
};

const styles = StyleSheet.create({
  pieceTray: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'flex-start',
    flexWrap: 'wrap',
    height: 500,
    width: pieceTrayWidthPx,
  },
  board: {
    resizeMode: 'contain',
  },
  placeholderPiece: {
    opacity: 0.5,
  },
  trayContainer: {
    flex: 1,
    flexDirection: 'row',
  },
  title: {
    fontSize: 16,
    paddingVertical: 5,
    paddingHorizontal: 10,
  },
});
