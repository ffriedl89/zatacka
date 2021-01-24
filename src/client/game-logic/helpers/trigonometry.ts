import { Point } from "../points";

export function degreeToRad(degree: number): number {
  return (degree * Math.PI) / 180;
}

export interface Circle extends Point {
  radius: number;
}