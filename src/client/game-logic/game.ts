import { clearCanvas } from './helpers/canvas';
import { resetGameState } from './game-state';
import { detectPlayersCrashing } from './collision';

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

  // function drawPowerups({ powerUpState }: GameState, ctx: CanvasRenderingContext2D): void {
  //   const powerUpsToDraw = [...powerUpState.powerUps];

  //   // check wheter to draw a new powerup
  //   const currentTime = new Date().getTime();
  //   if (currentTime > powerUpState.nextPowerUpTimestamp) {
  //     powerUpsToDraw.push({ type: 'SPEED', duration: 1500, boundingBox: { ...getRandomPowerUpPosition(width, height), radius: POWERUP_RADIUS }});
  //     powerUpState.nextPowerUpTimestamp = getRandomNumberBetween(POWERUP_TIME_MIN, POWERUP_TIME_MAX) + currentTime;
  //   }

  //   for (const powerUp of powerUpsToDraw) {
  //     ctx.beginPath();
  //     ctx.arc(powerUp.boundingBox.x, powerUp.boundingBox.y, 15, 0, Math.PI * 2);
  //     ctx.fillStyle = 'orange';
  //     ctx.fill();
  //     ctx.closePath();
  //   }

  //   powerUpState.powerUps = powerUpsToDraw;
  // }



  function update(timestamp: number, timeDelta: number): void {
    for (const player of Object.values(gameState.players)) {
      player.update(timeDelta, timestamp, gameState);
    }
  }

  function detectCollisions(timestamp: number): void {
    detectPlayersCrashing(Object.values(gameState.players), width, height, timestamp);
  }

  function draw(): void {
    clearCanvas(ctx, width, height);
    // draw all players
    for (const player of Object.values(gameState.players)) {
      player.draw();
    }
  }

  function gameLoop(): void {
    const loopTimestamp = new Date().getTime();
    if (gameState.running) {
      const secondsPassed = (loopTimestamp - (gameState.lastTimeStamp ?? 0)) / 1000;
      console.log('TimeDelta', secondsPassed)
      // Update game objects in the loop
      update(loopTimestamp, secondsPassed);

      // sendMyPlayerToHost();

      if (HOSTING) {
        detectCollisions(loopTimestamp);
      }

      draw();
    }
    window.requestAnimationFrame(gameLoop);
    gameState.lastTimeStamp = loopTimestamp;
  }

  // Start loop
  window.requestAnimationFrame(gameLoop);
  setupEventListeners();

  return { startGame, pauseGame, resetGame };
}