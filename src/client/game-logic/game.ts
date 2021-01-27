import { clearCanvas } from './helpers/canvas';
import { resetGameState } from './game-state';
import { detectPlayersCrashing, detectPowerUpPickup } from './collision';
import { PowerUp, PowerUpKind } from './powerups';
import { getRandomNumberBetween, getRandomPowerUpPosition } from './helpers/randomize';
import { DRAW_DEBUG_INFO, POWERUP_TIME_MAX, POWERUP_TIME_MIN } from './game-settings';
import { Communication } from '../comms/communication';

const HOSTING = true;

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
    communication.syncStart();
  }

  function setupEventListeners(): void {
    window.addEventListener('keydown', (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight') {
        gameState = {
          ...gameState,
          keysPressed: {
            ...gameState.keysPressed,
            ArrowRight: true
          }
        };
      } else if (e.key === 'ArrowLeft') {
        gameState = {
          ...gameState,
          keysPressed: {
            ...gameState.keysPressed,
            ArrowLeft: true
          }
        };
      }
    });

    window.addEventListener('keyup', (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight') {
        gameState = {
          ...gameState,
          keysPressed: {
            ...gameState.keysPressed,
            ArrowRight: false
          }
        };
      } else if (e.key === 'ArrowLeft') {
        gameState = {
          ...gameState,
          keysPressed: {
            ...gameState.keysPressed,
            ArrowLeft: false
          }
        };
      }
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
      // Update game objects in the loop
      update(loopTimestamp, secondsPassed);

      // sendMyPlayerToHost();

      if (HOSTING) {
        detectCollisions(loopTimestamp);
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
