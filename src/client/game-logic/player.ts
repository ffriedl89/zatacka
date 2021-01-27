import { PlayerPathPoint, Point } from './types';
import {
  DRAW_DEBUG_INFO,
  GAP_TIME,
  PLAYER_DEFAULT_LINE_SIZE,
  PLAYER_SIZE,
  PLAYER_SPEED,
  ROTATION_SPEED
} from './game-settings';
import { degreeToRad } from './helpers/trigonometry';
import { GameState } from './game-state';
import { getRandomAngle, getRandomGapTiming } from './helpers/randomize';
import { v4 as uuid } from '@lukeed/uuid';
import { PowerUpEffect } from './powerups';

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

const rocket = new Image();
rocket.src = '/assets/Rocket_white.png';
export class Player {
  static rocket = rocket;

  id = uuid();

  color: string;

  state: PlayerState = { type: 'GROUNDED', groundedUntil: new Date().getTime() + getRandomGapTiming() };

  speed = PLAYER_SPEED;

  position: Point;

  angle: number;

  path: PlayerPathPoint[] = [];

  hitBox: Triangle;

  hitBoxCenteroid: Point | null = null;

  scaleFactor = 1;

  effects: PowerUpEffect[] = [];

  ctx: CanvasRenderingContext2D;

  get hitBoxCircleRadius(): number {
    return (PLAYER_SIZE / 2) * this.scaleFactor;
  }

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
    this.hitBoxCenteroid = {
      x: this.position.x + (Math.cos(rotationInRad) * (this.hitBoxCircleRadius + 0.1)) / 2,
      y: this.position.y + (Math.sin(rotationInRad) * (this.hitBoxCircleRadius + 0.1)) / 2
    };

    /* angle between points of triangle */
    const triangleAngle = (Math.PI * 2) / 3;
    const hitBox = [];

    for (let i = 0; i < 3; i++) {
      const point = {
        x: this.hitBoxCenteroid.x + this.hitBoxCircleRadius * Math.cos(triangleAngle * i + rotationInRad),
        y: this.hitBoxCenteroid.y + this.hitBoxCircleRadius * Math.sin(triangleAngle * i + rotationInRad)
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
        gap: true,
        size: PLAYER_DEFAULT_LINE_SIZE * this.scaleFactor
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
        gap: shouldCreateGap,
        size: PLAYER_DEFAULT_LINE_SIZE * this.scaleFactor
      });
    }
    const indicesToRemove: number[] = [];
    this.effects.forEach((effect, index) => {
      if (effect.effectUntil < loopTimestamp) {
        effect.removeEffect(this);
        console.log(`%cPlayer ${this.color}'s powerup ${effect.kind} ended.`, `color: ${this.color};`);
        indicesToRemove.push(index);
      }
    });
    indicesToRemove.reverse().forEach(index => this.effects.splice(index, 1));
  }

  handleCrash(loopTimestamp: number): void {
    this.state = { type: 'CRASHED', crashedAt: loopTimestamp };
    console.log(this.path);
    console.log(this.color, 'crashed');
  }

  private _drawHead(): void {
    if (DRAW_DEBUG_INFO) {
      this.ctx.beginPath();
      this.ctx.lineWidth = 1;
      for (const corner of this.hitBox) {
        this.ctx.lineTo(corner.x, corner.y);
      }
      this.ctx.closePath();
      this.ctx.strokeStyle = this.color;
      this.ctx.stroke();
    }

    const rotation = degreeToRad(this.angle);
    const size = this.hitBoxCircleRadius * 2;

    this.ctx.translate(this.hitBoxCenteroid!.x, this.hitBoxCenteroid!.y);
    this.ctx.rotate(rotation);
    this.ctx.drawImage(Player.rocket, -size / 2, -size / 2, size, size);
    this.ctx.rotate(-rotation);
    this.ctx.translate(-this.hitBoxCenteroid!.x, -this.hitBoxCenteroid!.y);
  }

  private _drawPath(): void {
    let currentLineWidth = PLAYER_DEFAULT_LINE_SIZE;
    this.ctx.beginPath();
    for (const point of this.path) {
      this.ctx.strokeStyle = this.color;
      this.ctx.lineWidth = currentLineWidth;
      point.gap ? this.ctx.moveTo(point.x, point.y) : this.ctx.lineTo(point.x, point.y);
      if (currentLineWidth !== point.size) {
        this.ctx.stroke();
        this.ctx.beginPath();
      }
      currentLineWidth = point.size;
    }
    this.ctx.stroke();
  }
}
