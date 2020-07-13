import BoardQueryer from './BoardQueryer';
import React, {useEffect, useRef, useState} from 'react';
import {Coordinates, PieceColor} from './types';
import {
  Dimensions,
  Image,
  SafeAreaView,
  StyleSheet,
  StatusBar,
  Text,
  View,
} from 'react-native';
import {CANCEL, EMPTY} from './symbols';
import {
  BlackPiece,
  Piece,
  pieceSizePx,
  WhitePiece,
  HoverCallback,
  ReleaseCallback,
} from './pieces';
import {useMachine} from '@xstate/react';
import {gameMachine} from './game-machine';

const boardImage = require('../assets/board.png');

interface PieceState {
  color: PieceColor | null;
  position: string | null;
}

const App = () => {
  const boardRef = useRef(null);
  const boardPosition = useRef({x: 0, y: 0}).current;

  const [machineState, send, service] = useMachine(gameMachine);
  useEffect(() => {
    const subscription = service.subscribe((state) => {
      console.log(state.value, JSON.stringify(state.context, null, 2));
    });

    return subscription.unsubscribe;
  }, [service]);

  const {board: boardState, blackTray, whiteTray} = machineState.context;
  const [
    {color: placeholderColor, position: placeholderPosition},
    setPlaceholderState,
  ] = useState<PieceState>({color: null, position: null});
  useEffect(() => {
    send('NEW_GAME');
  }, [send]);

  const {canMoveBlackTray = false, canMoveWhiteTray = false} = flatten1Level(
    machineState.meta,
  );

  const {height: windowHeight, width: windowWidth} = Dimensions.get('window');
  const boardSize = Math.min(windowHeight, windowWidth);

  const board = new BoardQueryer({
    boardPosition,
    boardSize,
    boardState,
  });

  const hoverPositionRef = useRef<string | null>(null);

  const handlePieceHover = ({
    color,
    coordinates,
  }: {
    color: PieceColor;
    coordinates: Coordinates;
  }) => {
    const hoverPosition = getSelectedPosition({
      board,
      coordinates,
    });
    setPlaceholderState({
      color,
      position: hoverPosition,
    });
    hoverPositionRef.current = hoverPosition;
  };

  const handlePieceRelease = ({
    color,
    position,
  }: {
    color: PieceColor;
    position: string;
  }) => {
    setPlaceholderState({color, position: null});

    const from = position;
    const to = hoverPositionRef.current;
    if (from && to) {
      send({
        type: 'PLACE',
        from,
        to,
      });
      return CANCEL;
    }
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
                onHover={handlePieceHover}
                onRelease={handlePieceRelease}
                position={pos}
                xy={board.xyForPosition(pos)}
              />
            ))}
            {board.whitePositions.map((pos) => (
              <WhitePiece
                key={pos}
                onHover={handlePieceHover}
                onRelease={handlePieceRelease}
                position={pos}
                xy={board.xyForPosition(pos)}
              />
            ))}
          </Board>
          {placeholderColor && placeholderPosition && (
            <Piece
              color={placeholderColor}
              placeholder
              position={'placeholder'}
              xy={board.xyForPosition(placeholderPosition)}
            />
          )}
        </View>
        <View style={styles.trayContainer}>
          <PieceTray
            movable={canMoveBlackTray}
            onPieceHover={handlePieceHover}
            onPieceRelease={handlePieceRelease}
            pieces={blackTray}
            prefix="bt"
          />
          <PieceTray
            movable={canMoveWhiteTray}
            onPieceHover={handlePieceHover}
            onPieceRelease={handlePieceRelease}
            pieces={whiteTray}
            prefix="wt"
          />
        </View>
      </SafeAreaView>
    </>
  );
};

const pieceTrayWidthPx = 150;
const numPiecesPerRow = Math.floor(pieceTrayWidthPx / pieceSizePx);

const getXy = (i: number): Coordinates => {
  const col = i % numPiecesPerRow;
  const row = Math.floor(i / numPiecesPerRow);
  return {
    x: col * pieceSizePx + pieceSizePx / 2,
    y: row * pieceSizePx + pieceSizePx / 2,
  };
};

const PieceTray = ({
  movable = false,
  onPieceHover,
  onPieceRelease,
  pieces,
  prefix,
}: {
  movable?: boolean;
  onPieceHover: HoverCallback;
  onPieceRelease: ReleaseCallback;
  pieces: PieceColor[];
  prefix: string;
}) => {
  return (
    <View style={[styles.pieceTray]}>
      {pieces.map(
        (piece, i) =>
          piece !== EMPTY && (
            <Piece
              key={i}
              color={piece}
              position={`${prefix}${i}`}
              movable={movable}
              onHover={onPieceHover}
              onRelease={onPieceRelease}
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

const pieceSnapDistancePx = 70;

const getSelectedPosition = ({
  board,
  coordinates,
}: {
  board: BoardQueryer;
  coordinates: Coordinates;
}): string | null => {
  const {distance, position: emptyPosition} = board.nearestEmpty(coordinates);
  return distance < pieceSnapDistancePx ? emptyPosition : null;
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

const flatten1Level = (obj) => Object.assign({}, ...Object.values(obj));
