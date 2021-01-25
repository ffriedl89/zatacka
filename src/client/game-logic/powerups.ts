import {
  POWERUP_DURATION,
  POWERUP_RADIUS,
  POWERUP_SLOW_PENALTY_FACTOR,
  POWERUP_SPEED_BOOST
} from './game-settings';
import { Player } from './player';
import { Circle, Point } from './types';

export interface PowerUpState {
  powerUps: PowerUp[];
  nextPowerUpTimestamp: number;
}

interface BasePowerUp {
  kind: string;
  boundingBox: Circle;
  effectDuration: number;
}

type SpeedPowerUp = BasePowerUp & {
  kind: 'SPEED';
};

type SlowPowerUp = BasePowerUp & {
  kind: 'SLOW';
};

type GrowPowerUp = BasePowerUp & {
  kind: 'GROW';
};

type ShrinkPowerUp = BasePowerUp & {
  kind: 'SHRINK';
};

export type PowerUpKind = PowerUpType['kind'];

export type PowerUpType = SpeedPowerUp | SlowPowerUp | GrowPowerUp | ShrinkPowerUp;

export type PowerUpEffect = {
  kind: PowerUpKind;
  effectUntil: number;
  removeEffect: (player: Player) => void;
};

const image = new Image();
export class PowerUp implements BasePowerUp {
  kind: PowerUpKind;
  boundingBox: Circle;
  effectDuration = 1500;
  ctx: CanvasRenderingContext2D;

  constructor(ctx: CanvasRenderingContext2D, kind: PowerUpKind, startPostion: Point) {
    this.kind = kind;
    this.ctx = ctx;
    this.boundingBox = {
      radius: POWERUP_RADIUS,
      ...startPostion
    };
  }

  draw(): void {
    this.ctx.translate(this.boundingBox.x, this.boundingBox.y);    

    switch (this.kind) {
      case 'SPEED':
        image.src = 'assets/powerups/speed.png';
        break;
      case 'SLOW':
        image.src = 'assets/powerups/slow.png';
        break;
      case 'GROW':
        image.src = 'assets/powerups/grow.png';
        break;
      case 'SHRINK':
        image.src = 'assets/powerups/shrink.png';
        break;
    }
    this._drawPowerUpImage(image);

    this.ctx.translate(-this.boundingBox.x, -this.boundingBox.y);
  }

  private _drawPowerUpImage(image: HTMLImageElement): void {
    this.ctx.drawImage(image, -POWERUP_RADIUS, -POWERUP_RADIUS, POWERUP_RADIUS * 2, POWERUP_RADIUS * 2);
  }

  handleCollision(player: Player, powerUpState: PowerUpState): void {
    switch (this.kind) {
      case 'SPEED':
        player.speed += POWERUP_SPEED_BOOST;
        player.effects.push({
          effectUntil: new Date().getTime() + POWERUP_DURATION,
          kind: this.kind,
          removeEffect: player => {
            player.speed -= POWERUP_SPEED_BOOST;
          }
        });
        break;
      case 'SLOW':
        player.speed *= POWERUP_SLOW_PENALTY_FACTOR;
        player.effects.push({
          effectUntil: new Date().getTime() + POWERUP_DURATION,
          kind: this.kind,
          removeEffect: player => {
            player.speed /= POWERUP_SLOW_PENALTY_FACTOR;
          }
        });
        break;
      case 'GROW':
        player.hitBoxCircleRadius *= 1.5;
        player.effects.push({
          effectUntil: new Date().getTime() + POWERUP_DURATION,
          kind: this.kind,
          removeEffect: player => {
            player.hitBoxCircleRadius /= 1.5;
          }
        });
        break;
      case 'SHRINK':
        player.hitBoxCircleRadius *= 0.5;
        player.effects.push({
          effectUntil: new Date().getTime() + POWERUP_DURATION,
          kind: this.kind,
          removeEffect: player => {
            player.hitBoxCircleRadius /= 0.5;
          }
        });
        break;
      default:
        throw new Error(`Collision for Powerup ${this.kind} not yet implemented`);
    }
    const index = powerUpState.powerUps.indexOf(this);
    powerUpState.powerUps.splice(index, 1);
  }
}
