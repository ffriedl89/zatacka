export type Point = {
  x: number;
  y: number;
};

export type PlayerPathPoint = Point & {
  gap: boolean;
  size: number;
};

export interface Circle extends Point {
  radius: number;
}