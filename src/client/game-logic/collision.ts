import { isPointInCircle, isPointInTriangle, isPointOutsideOfPlayingField } from "./helpers/collision";
import { Player } from "./player";
import { PowerUpState } from "./powerups";

export function detectPlayersCrashing(players: Player[], width: number, height: number, loopTimestamp: number): void {
  for (const player of players) {
    // early exit if i am already crashed
    if (player.state.type === 'CRASHED') {
      continue;
    }

    const isOutsidePlayingField = player.hitBox.some(point => isPointOutsideOfPlayingField(point, width, height));

    // loop over all players and there path points and check whether
    // any of their points is inside my players triangle if so
    // i crashed either into myself or one of my enemies
    const isCrashed =
      isOutsidePlayingField ||
      players.some(otherPlayer => {
        return otherPlayer.path.some(point => {
          return !point.gap && isPointInTriangle(point, player.hitBox);
        });
      });
    if (isCrashed) {
      player.handleCrash(loopTimestamp);
    }
  }
}

export function detectPowerUpPickup(players: Player[], powerUpState: PowerUpState): void {
  const { powerUps } = powerUpState;
  if (powerUps.length === 0 ) {
    return;
  }

  for (const player of players) {
    if (player.state.type === 'CRASHED') {
      continue;
    }
    for (const powerUp of powerUps) {
      const hit = player.hitBox.some((point) => isPointInCircle(point, powerUp.boundingBox));
      if (hit) {
        console.log(`%cPlayer: ${player.color} picked up a ${powerUp.kind}`, `color: ${player.color};`);
        powerUp.handleCollision(player, powerUpState);
      }
    }
  }
}