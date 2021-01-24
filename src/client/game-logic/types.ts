export type Point = {
  x: number;
  y: number;
};

export type PlayerPathPoint = Point & {
  gap: boolean;
};

export interface Circle extends Point {
  radius: number;
}