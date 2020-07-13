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
import {Coordinates, PieceColor} from './types';
import {BLACK, CANCEL, WHITE} from './symbols';

const colorToImage: Map<symbol, any> = new Map([
  [BLACK, require('./pieceBlack.png')],
  [WHITE, require('./pieceWhite.png')],
]);

export const pieceSizePx = 64;

export const BlackPiece = (props: PieceParams) => (
  <Piece color={BLACK} {...props} />
);
export const WhitePiece = (props: PieceParams) => (
  <Piece color={WHITE} {...props} />
);

interface PieceParams {
  position: string;
  movable?: boolean;
  onHover?: HoverCallback;
  onRelease?: ReleaseCallback;
  placeholder?: boolean;
  xy: Coordinates;
}

export type HoverCallback = ({}: {
  color: PieceColor;
  coordinates: Coordinates;
  position: string;
}) => void;

export type ReleaseCallback = ({}: {
  color: PieceColor;
  position: string;
}) => symbol | void;

export const Piece = ({
  color,
  position,
  movable = false,
  onHover = () => {},
  onRelease = () => {},
  placeholder,
  xy,
}: PieceParams & {color: PieceColor}) => {
  const onHoverRef = useRef(onHover);
  onHoverRef.current = onHover;

  const onReleaseRef = useRef(onRelease);
  onReleaseRef.current = onRelease;

  const colorRef = useRef(color);
  colorRef.current = color;

  const positionRef = useRef(position);
  positionRef.current = position;

  const defaultXy = xyToPieceCenterXy(xy);
  const pan = useRef(new Animated.ValueXY(defaultXy)).current;

  const panResponder = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: () => true,
      onPanResponderMove({nativeEvent}, gestureState) {
        const {dx, dy} = gestureState;
        pan.setOffset({x: dx, y: dy});

        const hoverXy = addCoordinates(
          offsetToCenter(nativeEvent),
          pageCoordinates(nativeEvent),
        );
        onHoverRef.current({
          color: colorRef.current,
          coordinates: hoverXy,
          position: positionRef.current,
        });
      },
      onPanResponderRelease() {
        pan.flattenOffset();

        const behavior = onReleaseRef.current({
          color: colorRef.current,
          position: positionRef.current,
        });

        if (behavior !== CANCEL) {
          Animated.timing(pan, {
            duration: 100,
            toValue: defaultXy as any,
            useNativeDriver: false,
          }).start();
        }
      },
    }),
  ).current;

  useEffect(() => {
    if (defaultXy && placeholder) {
      pan.setValue(defaultXy);
    }
  }, [defaultXy, pan, placeholder]);

  const viewStyles: ViewStyle[] = [styles.container];
  viewStyles.push(styles.positionedPiece);
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

const xyToPieceCenterXy = ({x, y}: Coordinates): Coordinates => ({
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
