import React, {useEffect, useRef} from 'react';
import {
  Animated,
  Image,
  ImageStyle,
  PanResponder,
  StyleSheet,
  ViewStyle,
} from 'react-native';
import {Coordinates} from './types';
import BoardQueryer from './BoardQueryer';
import {BLACK, WHITE} from './symbols';

const colorToImage: Map<symbol, any> = new Map([
  [BLACK, require('./pieceBlack.png')],
  [WHITE, require('./pieceWhite.png')],
]);

const pieceSizePx = 64;
const pieceSnapDistancePx = 70;

export const BlackPiece = (props: PieceParams) => (
  <Piece color={BLACK} {...props} />
);
export const WhitePiece = (props: PieceParams) => (
  <Piece color={WHITE} {...props} />
);

interface PieceParams {
  board: BoardQueryer;
  movable?: boolean;
  placeholder?: boolean;
  position?: string;
  onHover?: ({}: {color: symbol; position: string | null}) => void;
}

export const Piece = ({
  board,
  color,
  movable = false,
  onHover = () => {},
  placeholder,
  position,
}: PieceParams & {color: symbol}) => {
  const defaultXy = position ? board.xyForPosition(position) : undefined;
  const pan = useRef(new Animated.ValueXY(defaultXy)).current;
  const panResponder = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: () => true,
      onPanResponderGrant() {
        pan.setOffset({
          x: (pan.x as any)._value,
          y: (pan.y as any)._value,
        });
      },
      onPanResponderMove({nativeEvent}, gestureState) {
        const {dx, dy} = gestureState;
        pan.setValue({x: dx, y: dy});

        const {pageX, pageY} = nativeEvent;
        const {distance, position: emptyPosition} = board.nearestEmpty({
          x: pageX,
          y: pageY,
        });
        onHover({
          color,
          position: distance < pieceSnapDistancePx ? emptyPosition : null,
        });
      },
      onPanResponderRelease() {
        onHover({color, position: null});
        Animated.timing(pan, {
          duration: 100,
          toValue: 0,
          useNativeDriver: false,
        }).start();
      },
    }),
  ).current;

  useEffect(() => {
    if (position) {
      pan.setValue(boardXyToPieceXy(board.xyForPosition(position)));
    }
  }, [board, pan, position]);

  const viewStyles: ViewStyle[] = [];
  if (position) {
    viewStyles.push(styles.positionedPiece);
  }
  viewStyles.push(pan.getLayout());

  const imageStyles: ImageStyle[] = [styles.piece];
  if (placeholder) {
    imageStyles.push(styles.placeholderPiece);
  }

  return (
    <Animated.View
      style={viewStyles}
      {...(movable ? panResponder.panHandlers : {})}>
      <Image source={colorToImage.get(color)} style={imageStyles} />
    </Animated.View>
  );
};

const boardXyToPieceXy = ({x, y}: Coordinates): Coordinates => ({
  x: x - pieceSizePx / 2,
  y: y - pieceSizePx / 2,
});

const styles = StyleSheet.create({
  piece: {
    height: pieceSizePx,
    width: pieceSizePx,
  },
  positionedPiece: {
    position: 'absolute',
  },
  placeholderPiece: {
    opacity: 0.5,
  },
});
