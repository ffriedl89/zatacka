import { GAP_TIME_MAX, GAP_TIME_MIN, START_POSITION_MIN_EDGE_DISTANCE } from "../game-settings";
import { Point } from "../points";

export function getRandomNumberBetween(min: number, max: number): number {
  return Math.random() * (max - min) + min;
}

export function getRandomGapTiming(): number {
  return getRandomNumberBetween(GAP_TIME_MAX, GAP_TIME_MIN);
}

export function getRandomStartPosition(width: number, height: number): Point {
  return {
    x: getRandomNumberBetween(START_POSITION_MIN_EDGE_DISTANCE, width - START_POSITION_MIN_EDGE_DISTANCE),
    y: getRandomNumberBetween(START_POSITION_MIN_EDGE_DISTANCE, height - START_POSITION_MIN_EDGE_DISTANCE)
  };
}

export function getRandomAngle(): number {
  return getRandomNumberBetween(0, 359);
}

export function getRandomPowerUpPosition(width: number, height: number): Point {
  return {
    x: getRandomNumberBetween(0, width),
    y: getRandomNumberBetween(0, height)
  };
}