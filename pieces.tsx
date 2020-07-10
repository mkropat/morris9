import React, {useEffect, useRef} from 'react';
import {addCoordinates} from './coordinates';
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

export const pieceSizePx = 64;
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
  onHover?: ({}: {color: symbol; position: string | null}) => void;
  xy?: Coordinates;
}

export const Piece = ({
  board,
  color,
  movable = false,
  onHover = () => {},
  placeholder,
  xy,
}: PieceParams & {color: symbol}) => {
  const defaultXy = xy && boardXyToPieceXy(xy);
  const initialPosition = useRef(defaultXy).current;
  const pan = useRef(new Animated.ValueXY(defaultXy)).current;
  const panResponder = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: () => true,
      onPanResponderGrant({nativeEvent}) {
        console.log('grant', nativeEvent);
        pan.setValue({
          x: (pan.x as any)._value,
          y: (pan.y as any)._value,
        });
      },
      onPanResponderMove({nativeEvent}, gestureState) {
        const {dx, dy} = gestureState;
        pan.setOffset({x: dx, y: dy});

        console.log('move', {
          gestureState,
          nativeEvent,
        });
        const pieceCoordinates = addCoordinates(
          offsetToCenter(nativeEvent),
          pageCoordinates(nativeEvent),
        );
        const {distance, position: emptyPosition} = board.nearestEmpty(
          pieceCoordinates,
        );
        onHover({
          color,
          position: distance < pieceSnapDistancePx ? emptyPosition : null,
        });
      },
      onPanResponderRelease({nativeEvent}) {
        console.log('release', nativeEvent);
        pan.flattenOffset();
        onHover({color, position: null});
        Animated.timing(pan, {
          duration: 100,
          toValue: initialPosition as any,
          useNativeDriver: false,
        }).start();
      },
    }),
  ).current;

  useEffect(() => {
    if (defaultXy && placeholder) {
      pan.setValue(defaultXy);
    }
  }, [defaultXy, pan, placeholder]);

  const viewStyles: ViewStyle[] = [styles.container];
  if (xy) {
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

const offsetToCenter = ({
  locationX,
  locationY,
}: {
  locationX: number;
  locationY: number;
}): Coordinates => ({
  x: pieceSizePx / 2 - locationX,
  y: pieceSizePx / 2 - locationY,
});

const pageCoordinates = ({
  pageX,
  pageY,
}: {
  pageX: number;
  pageY: Number;
}): Coordinates => ({
  x: pageX.valueOf(),
  y: pageY.valueOf(),
});

const styles = StyleSheet.create({
  container: {
    height: pieceSizePx,
    width: pieceSizePx,
  },
  piece: {},
  positionedPiece: {
    position: 'absolute',
  },
  placeholderPiece: {
    opacity: 0.5,
  },
});
