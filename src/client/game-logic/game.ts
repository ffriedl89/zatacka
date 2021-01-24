import { drawPlayer, Player } from './player';
import { clearCanvas } from './helpers/canvas';
import { detectPlayersCrashing, detectPowerUpPickup } from './collision';
import { GameState, resetGameState } from './game-state';
import { Ref } from 'preact/hooks';
import { getRandomNumberBetween, getRandomPowerUpPosition } from './helpers/randomize';
import { POWERUP_RADIUS, POWERUP_TIME_MAX, POWERUP_TIME_MIN } from './game-settings';

export function initGame(ctx: CanvasRenderingContext2D, isRunningRef: Ref<boolean>, width: number, height: number): void {
  let gameState = resetGameState(width, height);

  function resetGame(): void {
    gameState = resetGameState(width, height);
    clearCanvas(ctx, width, height);
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

    window.addEventListener('powerup-speed-pickedup', (player) => {
      gameState = {
        ...gameState
      };
    });
  }

  function drawPowerups({ powerUpState }: GameState, ctx: CanvasRenderingContext2D): void {
    const powerUpsToDraw = [...powerUpState.powerUps];

    // check wheter to draw a new powerup
    const currentTime = new Date().getTime();
    if (currentTime > powerUpState.nextPowerUpTimestamp) {
      powerUpsToDraw.push({ type: 'SPEED', duration: 1500, boundingBox: { ...getRandomPowerUpPosition(width, height), radius: POWERUP_RADIUS }});
      powerUpState.nextPowerUpTimestamp = getRandomNumberBetween(POWERUP_TIME_MIN, POWERUP_TIME_MAX) + currentTime;
    }

    for (const powerUp of powerUpsToDraw) {
      ctx.beginPath();
      ctx.arc(powerUp.boundingBox.x, powerUp.boundingBox.y, 15, 0, Math.PI * 2);
      ctx.fillStyle = 'orange';
      ctx.fill();
      ctx.closePath();
    }

    powerUpState.powerUps = powerUpsToDraw;
  }

  function draw(): void {
    clearCanvas(ctx, width, height);
    // draw all players
    let playersArr = Object.values(gameState.players).map(player => drawPlayer(player, ctx, gameState));

    drawPowerups(gameState, ctx);

    //gameState = detectPowerUpPickup(playersArr, gameState);

    // check for collisions
    playersArr = detectPlayersCrashing(playersArr, width, height);

    // reset game when all players are crashed
    if (playersArr.every(player => player.state.type === 'CRASHED')) {
      resetGame();
      return;
    }

    // update game state
    gameState = {
      ...gameState,
      players: playersArr.reduce<Record<string, Player>>((players, player) => {
        players[player.id] = player;
        return players;
      }, {})
    };
  }

  function gameLoop(timestamp: number): void {
    if (isRunningRef.current) {
      const timeDelta = timestamp - (gameState.lastTimeStamp ?? 0);
      gameState.timeDelta = timeDelta;
      draw();
    }
    window.requestAnimationFrame(gameLoop);
    gameState.lastTimeStamp = timestamp;
  }

  // Start loop
  window.requestAnimationFrame(gameLoop);
  setupEventListeners();
}