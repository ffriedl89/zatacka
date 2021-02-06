import { clearCanvas } from './helpers/canvas';
import { KeysPressedState, resetGameState } from './game-state';
import { detectPlayersCrashing, detectPowerUpPickup } from './collision';
import { PowerUp, PowerUpKind, PowerUpTransferData } from './powerups';
import { getRandomNumberBetween, getRandomPowerUpPosition } from './helpers/randomize';
import { DRAW_DEBUG_INFO, POWERUP_TIME_MAX, POWERUP_TIME_MIN } from './game-settings';
import { Communication } from '../comms/communication';
import { Player, PlayerTransferData } from './player';

export type GameControls = {
  startGame: () => void;
  pauseGame: () => void;
  resetGame: () => void;
};

export function initGame(ctx: CanvasRenderingContext2D, width: number, height: number): GameControls {
  let gameState = resetGameState(width, height, ctx);

  function resetGame(): void {
    gameState = resetGameState(width, height, ctx);
    clearCanvas(ctx, width, height);
  }

  function startGame(): void {
    gameState.running = true;
  }

  function pauseGame(): void {
    gameState.running = false;
  }

  const communication: Communication = (window as any).gameConnection;
  if (communication) {
    communication.startGame = startGame;
    gameState.running = false;
    communication.syncStart();

    if (communication.host) {
      const playerList = Object.keys(gameState.players);
      communication.playerToConnectionMap.set(playerList[0], communication._peer.id);

      // Connect client players to communication connections
      for (let i = 1; i < playerList.length; i += 1) {
        communication.playerToConnectionMap.set(playerList[i], communication._connections[i - 1].peer);
      }
    }

    if (!communication.host) {
      communication.clientPlayersUpdate = (transferPlayers: PlayerTransferData[]): void => {
        const players = transferPlayers.reduce<Record<string, Player>>((allPlayers, player) => {
          const p =
            gameState.players[player.color] || new Player({ color: player.color, startPosition: player.position, ctx });
          p.transferData = player;
          allPlayers[player.color] = p;
          return allPlayers;
        }, {});
        gameState = {
          ...gameState,
          ...{
            players
          }
        };
      };
      communication.powerUpAdded = (transferPowerUp: PowerUpTransferData): void => {
        const addedPowerUp = new PowerUp(ctx, transferPowerUp.kind, {
          x: transferPowerUp.boundingBox.x,
          y: transferPowerUp.boundingBox.y
        });
        addedPowerUp.transferData = transferPowerUp;
        gameState.powerUpState.powerUps.push(addedPowerUp);
      };
      communication.powerUpRemoved = (powerUpId: string): void => {
        const index = gameState.powerUpState.powerUps.findIndex(p => p.id === powerUpId);
        gameState.powerUpState.powerUps.splice(index, 1);
      };
    }
  }

  function setupEventListeners(): void {
    window.addEventListener('keydown', (e: KeyboardEvent) => {
      // This is a bit odd and can certainly be improved
      // it's simply to keep single player testing working as well

      // Deal with No Communication state
      if (!communication) {
        if (e.key === 'ArrowRight') {
          const keysPressed = Object.entries(gameState.keysPressed).reduce<Record<string, KeysPressedState>>(
            (keys, [playerId, playerKeys]) => {
              keys[playerId] = {
                ...playerKeys,
                ArrowRight: true
              };
              return keys;
            },
            {}
          );

          gameState = {
            ...gameState,
            keysPressed
          };
        } else if (e.key === 'ArrowLeft') {
          const keysPressed = Object.entries(gameState.keysPressed).reduce<Record<string, KeysPressedState>>(
            (keys, [playerId, playerKeys]) => {
              keys[playerId] = {
                ...playerKeys,
                ArrowLeft: true
              };
              return keys;
            },
            {}
          );

          gameState = {
            ...gameState,
            keysPressed
          };
        }
      }

      // if (!communication || (communication && communication.host)) {
      //   if (e.key === 'ArrowRight') {
      //     gameState = {
      //       ...gameState,
      //       keysPressed: {
      //         ...gameState.keysPressed
      //         ArrowRight: true
      //       }
      //     };
      //   } else if (e.key === 'ArrowLeft') {
      //     gameState = {
      //       ...gameState,
      //       keysPressed: {
      //         ...gameState.keysPressed
      //         ArrowLeft: true
      //       }
      //     };
      //   }
      // }
    });

    window.addEventListener('keyup', (e: KeyboardEvent) => {
      // This is a bit odd and can certainly be improved
      // it's simply to keep single player testing working as well

      // Deal with No Communication state
      // Deal with No Communication state
      if (!communication) {
        if (e.key === 'ArrowRight') {
          const keysPressed = Object.entries(gameState.keysPressed).reduce<Record<string, KeysPressedState>>(
            (keys, [playerId, playerKeys]) => {
              keys[playerId] = {
                ...playerKeys,
                ArrowRight: false
              };
              return keys;
            },
            {}
          );

          gameState = {
            ...gameState,
            keysPressed
          };
        } else if (e.key === 'ArrowLeft') {
          const keysPressed = Object.entries(gameState.keysPressed).reduce<Record<string, KeysPressedState>>(
            (keys, [playerId, playerKeys]) => {
              keys[playerId] = {
                ...playerKeys,
                ArrowLeft: false
              };
              return keys;
            },
            {}
          );

          gameState = {
            ...gameState,
            keysPressed
          };
        }
      }

      // if (!communication || (communication && communication.host)) {
      //   if (e.key === 'ArrowRight') {
      //     gameState = {
      //       ...gameState,
      //       keysPressed: {
      //         ...gameState.keysPressed
      //         ArrowRight: false
      //       }
      //     };
      //   } else if (e.key === 'ArrowLeft') {
      //     gameState = {
      //       ...gameState,
      //       keysPressed: {
      //         ...gameState.keysPressed
      //         ArrowLeft: false
      //       }
      //     };
      //   }
      // }
    });
  }

  function update(timestamp: number, timeDelta: number): void {
    for (const player of Object.values(gameState.players)) {
      player.update(timeDelta, timestamp, gameState);
    }
    const { powerUpState } = gameState;

    // PowerUps
    // check wheter to draw a new powerup
    if (timestamp > powerUpState.nextPowerUpTimestamp) {
      // TODO fix powerup typing here
      const allKinds: PowerUpKind[] = ['SPEED', 'SLOW', 'GROW', 'SHRINK'];
      const powerUpKind: PowerUpKind = allKinds[Math.floor(getRandomNumberBetween(0, allKinds.length))];

      const powerUp = new PowerUp(ctx, powerUpKind, { ...getRandomPowerUpPosition(width, height) });
      powerUpState.nextPowerUpTimestamp = getRandomNumberBetween(POWERUP_TIME_MIN, POWERUP_TIME_MAX) + timestamp;
      powerUpState.powerUps.push(powerUp);

      if (communication && communication.host) {
        communication.addPowerUp(powerUp);
      }
    }
  }

  function detectCollisions(timestamp: number): void {
    detectPlayersCrashing(Object.values(gameState.players), width, height, timestamp);
    detectPowerUpPickup(Object.values(gameState.players), gameState.powerUpState);
  }

  function draw(): void {
    clearCanvas(ctx, width, height);
    // draw all players
    for (const player of Object.values(gameState.players)) {
      player.draw();
    }

    for (const powerUp of gameState.powerUpState.powerUps) {
      powerUp.draw();
    }
  }

  function gameLoop(): void {
    const loopTimestamp = new Date().getTime();
    if (gameState.running) {
      const secondsPassed = (loopTimestamp - (gameState.lastTimeStamp ?? 0)) / 1000;

      // sendMyPlayerToHost();
      if (!communication) {
        update(loopTimestamp, secondsPassed);

        detectCollisions(loopTimestamp);
      } else if (communication && communication.host) {
        // Update game objects in the loop
        update(loopTimestamp, secondsPassed);

        detectCollisions(loopTimestamp);
        communication.syncGameState(gameState);
      }

      draw();
      // Calculate fps
      const fps = Math.round(1 / secondsPassed);

      if (DRAW_DEBUG_INFO) {
        ctx.font = '12px Arial';
        ctx.fillStyle = 'white';
        ctx.fillText('FPS: ' + fps, 10, 30);
      }
    }
    window.requestAnimationFrame(gameLoop);
    gameState.lastTimeStamp = loopTimestamp;
  }

  // Start loop
  window.requestAnimationFrame(gameLoop);
  setupEventListeners();

  return { startGame, pauseGame, resetGame };
}
