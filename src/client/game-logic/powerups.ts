import { Circle } from "./helpers/trigonometry";

export interface PowerUpState {
  powerUps: PowerUp[];
  nextPowerUpTimestamp: number;
}

type BasePowerUp = {
  type: string;
  boundingBox: Circle;
}

type SpeedPowerUp = BasePowerUp & {
  type: 'SPEED';
  duration: number;
}

export type PowerUp = SpeedPowerUp;