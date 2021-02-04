import { POWERUP_DURATION, POWERUP_RADIUS, POWERUP_SLOW_PENALTY, POWERUP_SPEED_BOOST } from './game-settings';
import { Player } from './player';
import { Circle, Point } from './types';
import { v4 as uuid } from '@lukeed/uuid';

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

export interface PowerUpTransferData {
  id: string;
  boundingBox: Circle;
  effectDuration: number;
  kind: PowerUpKind;
}
export class PowerUp implements BasePowerUp {
  id = uuid();

  kind: PowerUpKind;
  boundingBox: Circle;
  effectDuration = 1500;
  ctx: CanvasRenderingContext2D;
  private _image = new Image();

  constructor(ctx: CanvasRenderingContext2D, kind: PowerUpKind, startPostion: Point) {
    this.kind = kind;
    this.ctx = ctx;
    this.boundingBox = {
      radius: POWERUP_RADIUS,
      ...startPostion
    };
    this._setImageSrc();
  }

  get transferData(): PowerUpTransferData {
    return {
      id: this.id,
      boundingBox: this.boundingBox,
      effectDuration: this.effectDuration,
      kind: this.kind
    };
  }
  set transferData(value: PowerUpTransferData) {
    this.id = value.id;
    this.boundingBox = value.boundingBox;
    this.effectDuration = value.effectDuration;
    this.kind = value.kind;
  }

  draw(): void {
    this.ctx.translate(this.boundingBox.x, this.boundingBox.y);

    this._drawPowerUpImage(this._image);

    this.ctx.translate(-this.boundingBox.x, -this.boundingBox.y);
  }

  handleCollision(player: Player, powerUpState: PowerUpState): void {
    switch (this.kind) {
      case 'SPEED':
        player.speed *= POWERUP_SPEED_BOOST;
        player.effects.push({
          effectUntil: new Date().getTime() + POWERUP_DURATION,
          kind: this.kind,
          removeEffect: player => {
            console.log('player speed before', player.speed);
            player.speed /= POWERUP_SPEED_BOOST;
            console.log('player speed after', player.speed);
          }
        });
        break;
      case 'SLOW':
        player.speed *= POWERUP_SLOW_PENALTY;
        player.effects.push({
          effectUntil: new Date().getTime() + POWERUP_DURATION,
          kind: this.kind,
          removeEffect: player => {
            player.speed /= POWERUP_SLOW_PENALTY;
          }
        });
        break;
      case 'GROW':
        player.scaleFactor *= 2;
        console.log(player.scaleFactor);
        player.effects.push({
          effectUntil: new Date().getTime() + POWERUP_DURATION,
          kind: this.kind,
          removeEffect: player => {
            player.scaleFactor /= 2;
          }
        });
        break;
      case 'SHRINK':
        player.scaleFactor *= 0.5;
        player.effects.push({
          effectUntil: new Date().getTime() + POWERUP_DURATION,
          kind: this.kind,
          removeEffect: player => {
            player.scaleFactor /= 0.5;
          }
        });
        break;
      default:
        throw new Error(`Collision for Powerup ${this.kind} not yet implemented`);
    }
    const index = powerUpState.powerUps.indexOf(this);
    powerUpState.powerUps.splice(index, 1);

    // Not quite happy to do that here, but idk
    if ((window as any)?.gameConnection?.host) {
      (window as any)?.gameConnection.removePowerUp(this.id);
    }
  }

  private _drawPowerUpImage(image: HTMLImageElement): void {
    this.ctx.drawImage(image, -POWERUP_RADIUS, -POWERUP_RADIUS, POWERUP_RADIUS * 2, POWERUP_RADIUS * 2);
  }

  private _setImageSrc(): void {
    switch (this.kind) {
      case 'SPEED':
        this._image.src = 'assets/powerups/speed.png';
        break;
      case 'SLOW':
        this._image.src = 'assets/powerups/slow.png';
        break;
      case 'GROW':
        this._image.src = 'assets/powerups/grow.png';
        break;
      case 'SHRINK':
        this._image.src = 'assets/powerups/shrink.png';
        break;
    }
  }
}
