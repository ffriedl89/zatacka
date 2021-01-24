import { PLAYER_SPEED, POWERUP_TIME_MAX, POWERUP_TIME_MIN } from './game-settings';
import { getRandomAngle, getRandomGapTiming, getRandomNumberBetween, getRandomStartPosition } from './helpers/randomize';
import { Player } from './player';
import { v4 as uuid } from '@lukeed/uuid';
import { PowerUpState } from './powerups';

export interface GameState {
  lastTimeStamp?: number;
  timeDelta: number;
  players: Record<string, Player>;
  powerUpState: PowerUpState;
  keysPressed: { ArrowLeft: boolean; ArrowRight: boolean };
}

/** Temporary generation function */
function generatePlayers(width: number, height: number): Record<string, Player> {
  return ['blue', 'red', 'green', 'rebeccapurple', 'orange', 'hotpink', 'black', 'gray'].reduce<Record<string, Player>>(
    (players, color) => {
      const id = uuid();
      players[id] = {
        id,
        state: { type: 'GROUNDED', groundedUntil: new Date().getTime() + getRandomGapTiming() },
        speed: PLAYER_SPEED,
        angle: getRandomAngle(),
        position: getRandomStartPosition(width, height),
        path: [],
        color
      };
      return players;
    },
    {}
  );
}

export function resetGameState(width: number, height: number): GameState {
  return {
    timeDelta: 0,
    players: generatePlayers(width, height),
    powerUpState: {
      nextPowerUpTimestamp: getRandomNumberBetween(POWERUP_TIME_MIN, POWERUP_TIME_MAX) + new Date().getTime(),
      powerUps: []
    },
    keysPressed: {
      ArrowLeft: false,
      ArrowRight: false
    }
  };
}