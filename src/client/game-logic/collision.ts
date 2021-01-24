import { isPointInTriangle, isPointOutsideOfPlayingField } from "./helpers/collision";
import { Player } from "./player";

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

// export function detectPowerUpPickup(players: Player[], gameState: GameState): GameState {
//   const { powerUpState } = gameState;
//   const powerUpIndicesToRemove = new Set<number>();

//   const updatedPlayers = players.map((player) => {
//     // early exit if i am already crashed
//     if (player.state.type === 'CRASHED' || powerUpState.powerUps.length === 0) {
//       return player;
//     }

//     // If the player is not crashed - we know that there is a playerTriangle defined.
//     // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
//     const triangle = player.playerTriangle!;

//     // Clone player before modifying its state
//     const clonedPlayer = { ...player };

//     powerUpState.powerUps.forEach((powerUp, index) => {
//       const hit = triangle.some((point) => isPointInCircle(point, powerUp.boundingBox));
//       if (hit) {
//         console.log('hit', index);
//         powerUpIndicesToRemove.add(index);
//         switch(powerUp.type) {
//           case 'SPEED':
//             console.log('increase speed for player', clonedPlayer.color);
//             clonedPlayer.speed += POWERUP_SPEED_BOOST;
//             break;
//           default:
//             throw new Error('Unknown powerUp type detected for collision');
//         }

//       }
//     });
  
//     return clonedPlayer;
//   });

//   const indicesArr = Array.from(powerUpIndicesToRemove);
//   indicesArr.sort((a, b) => b - a);
//   indicesArr.forEach((index) => {
//     powerUpState.powerUps.splice(index, 1);
//   });

//   return {
//     ...gameState,
//     players: updatedPlayers.reduce<Record<string, Player>>((players, player) => {
//       players[player.id] = player;
//       return players;
//     }, {}),
//   }
// }