import { PlayerPathPoint, Point } from './types';
import { GAP_TIME, PLAYER_SIZE, PLAYER_SPEED, ROTATION_SPEED } from './game-settings';
import { degreeToRad } from './helpers/trigonometry';
import { GameState } from './game-state';
import { getRandomAngle, getRandomGapTiming } from './helpers/randomize';
import { v4 as uuid } from '@lukeed/uuid';

type BaseState = {
  type: string;
};

type GroundedState = BaseState & {
  type: 'GROUNDED';
  groundedUntil: number;
};

type FlyingState = BaseState & {
  type: 'FLYING';
  flyingUntil: number;
};

type CrashedState = BaseState & {
  type: 'CRASHED';
  crashedAt: number;
};

type PlayerState = GroundedState | FlyingState | CrashedState;

type Triangle = [Point, Point, Point];
export class Player {
  id = uuid();

  color: string;

  state: PlayerState = { type: 'GROUNDED', groundedUntil: new Date().getTime() + getRandomGapTiming() };

  speed = PLAYER_SPEED;

  position: Point;

  angle: number;

  path: PlayerPathPoint[] = [];

  hitBox: Triangle;

  ctx: CanvasRenderingContext2D;

  hitBoxCircleRadius: number = PLAYER_SIZE / 2;

  private get _rotationInRad(): number {
    return degreeToRad(this.angle);
  }

  constructor({ color, startPosition, ctx }: { color: string; startPosition: Point; ctx: CanvasRenderingContext2D }) {
    this.color = color;
    this.position = startPosition;
    this.angle = getRandomAngle();
    this.ctx = ctx;

    this.hitBox = this._calculateHitbox();
  }

  /** Calculates a hitbox based on the current position, angle, and radius */
  private _calculateHitbox(): Triangle {
    const rotationInRad = this._rotationInRad;

    // The centroid for the triangle is shifted from the current position to
    // adjust have the path and triangle not collide for the same player
    const triangleCentroid = {
      x: this.position.x + (Math.cos(rotationInRad) * (this.hitBoxCircleRadius + 0.1)) / 2,
      y: this.position.y + (Math.sin(rotationInRad) * (this.hitBoxCircleRadius + 0.1)) / 2
    };

    /* angle between points of triangle */
    const triangleAngle = (Math.PI * 2) / 3;
    const hitBox = [];

    for (let i = 0; i < 3; i++) {
      const point = {
        x: triangleCentroid.x + this.hitBoxCircleRadius * Math.cos(triangleAngle * i + rotationInRad),
        y: triangleCentroid.y + this.hitBoxCircleRadius * Math.sin(triangleAngle * i + rotationInRad)
      };
      hitBox.push(point);
    }
    return hitBox as Triangle;
  }

  draw(): void {
    this.state.type !== 'CRASHED' && this._drawHead();
    this._drawPath();
  }

  update(timeDelta: number, loopTimestamp: number, { keysPressed }: GameState): void {
    if (this.state.type === 'CRASHED') {
      return;
    }

    const rotationDelta = timeDelta * ROTATION_SPEED;
    if (keysPressed.ArrowLeft) {
      this.angle -= rotationDelta;
    } else if (keysPressed.ArrowRight) {
      this.angle += rotationDelta;
    }
    const rotation = degreeToRad(this.angle);
    // calculate next position
    this.position = {
      x: this.position.x + Math.cos(rotation) * (timeDelta * this.speed),
      y: this.position.y + Math.sin(rotation) * (timeDelta * this.speed)
    };

    this.hitBox = this._calculateHitbox();

    if (this.state.type === 'FLYING') {
      this.path.push({
        ...this.position,
        gap: true
      });
      const shouldBeGrounded = loopTimestamp > this.state.flyingUntil;
      if (shouldBeGrounded) {
        this.state = { type: 'GROUNDED', groundedUntil: loopTimestamp + getRandomGapTiming() };
      }
    } else if (this.state.type === 'GROUNDED') {
      const shouldCreateGap = loopTimestamp > this.state.groundedUntil;

      if (shouldCreateGap) {
        this.state = { type: 'FLYING', flyingUntil: loopTimestamp + GAP_TIME };
      }
      this.path.push({
        ...this.position,
        gap: shouldCreateGap
      });
    }
  }

  handleCrash(loopTimestamp: number): void {
    this.state = { type: 'CRASHED', crashedAt: loopTimestamp };
    console.log(this.color, 'crashed');
  }

  private _drawHead(): void {
    this.ctx.beginPath();
    for (const corner of this.hitBox) {
      this.ctx.lineTo(corner.x, corner.y);
    }
    this.ctx.closePath();
    this.ctx.strokeStyle = this.color;
    this.ctx.stroke();
  }

  private _drawPath(): void {
    this.ctx.beginPath();
    for (const point of this.path) {
      point.gap ? this.ctx.moveTo(point.x, point.y) : this.ctx.lineTo(point.x, point.y);
    }
    this.ctx.strokeStyle = this.color;
    this.ctx.stroke();
  }
}
