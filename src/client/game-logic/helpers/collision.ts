import { Point, Circle } from "../types/points";

export function isPointInTriangle(point: Point, triangle: [Point, Point, Point]): boolean {
  const [p1, p2, p3] = triangle;

  const denominator = (p2.y - p3.y) * (p1.x - p3.x) + (p3.x - p2.x) * (p1.y - p3.y);
  const a = ((p2.y - p3.y) * (point.x - p3.x) + (p3.x - p2.x) * (point.y - p3.y)) / denominator;
  const b = ((p3.y - p1.y) * (point.x - p3.x) + (p1.x - p3.x) * (point.y - p3.y)) / denominator;
  const c = 1 - a - b;

  return 0 <= a && a <= 1 && 0 <= b && b <= 1 && 0 <= c && c <= 1;
}

export function isPointOutsideOfPlayingField(point: Point, width: number, height: number): boolean {
  return point.x < 0 || point.y < 0 || point.x > width || point.y > height;
}

export function isPointInCircle(point: Point, circle: Circle): boolean {
  // Calculate the distance between the point and circles center
  const squareDistance = (point.x-circle.x)*(point.x-circle.x) + (point.y-circle.y)*(point.y-circle.y);

  // if the distance is smaller or equal to the radius squared the circle touches or overlaps the point
  return squareDistance <= circle.radius * circle.radius;
}