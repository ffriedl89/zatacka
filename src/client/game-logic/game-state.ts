import { POWERUP_TIME_MAX, POWERUP_TIME_MIN } from './game-settings';
import { getRandomNumberBetween, getRandomStartPosition } from './helpers/randomize';
import { Player } from './player';
import { PowerUpState } from './powerups';

export type KeysPressedState = { ArrowLeft: boolean; ArrowRight: boolean };
export interface GameState {
  running: boolean;
  lastTimeStamp?: number;
  lastSyncStamp?: number;
  timeDelta: number;
  players: Record<string, Player>;
  powerUpState: PowerUpState;
  keysPressed: KeysPressedState;
}

/** Temporary generation function */
function generatePlayers(width: number, height: number, ctx: CanvasRenderingContext2D): Record<string, Player> {
  return ['blue', 'red'].reduce<Record<string, Player>>((players, color) => {
    const player = new Player({
      startPosition: getRandomStartPosition(width, height),
      color,
      ctx
    });

    players[player.id] = player;
    return players;
  }, {});
}

export function resetGameState(width: number, height: number, ctx: CanvasRenderingContext2D): GameState {
  return {
    running: false,
    timeDelta: 0,
    players: generatePlayers(width, height, ctx),
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
