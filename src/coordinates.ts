import {Coordinates} from './types';

export const addCoordinates = (
  l: Coordinates,
  r: Coordinates,
): Coordinates => ({
  x: l.x + r.x,
  y: l.y + r.y,
});

export const getDistance = (l: Coordinates, r: Coordinates): number => {
  const a = l.x - r.x;
  const b = l.y - r.y;
  return Math.sqrt(a * a + b * b);
};
