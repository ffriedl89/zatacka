import { FunctionalComponent, h } from 'preact';
import { Ref, useEffect, useRef, useState } from 'preact/hooks';
import * as style from './style.css';

interface GameState {
  lastTimeStamp?: number;
  timeDelta: number;
  player: Player;
  keysPressed: { ArrowLeft: boolean; ArrowRight: boolean };
}

interface Player {
  speed: number;
  angle: number;
  position: PlayerPosition;
  path: PlayerPosition[];
}

interface PlayerPosition {
  x: number;
  y: number;
}

const PLAYER_SPEED = 0.08;
const ROTATION_SPEED = 0.15;
const PLAYER_SIZE = 16;

function degreeToRad(degree: number): number {
  return (degree * Math.PI) / 180;
}

function clearCanvas(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number
): void {
  ctx.clearRect(0, 0, width, height);
}

function resetGameState(): GameState {
  return {
    timeDelta: 0,
    player: {
      speed: PLAYER_SPEED,
      angle: 0,
      position: {
        x: 200,
        y: 200
      },
      path: []
    },
    keysPressed: {
      ArrowLeft: false,
      ArrowRight: false
    }
  };
}

function initGame(
  ctxPlayers: CanvasRenderingContext2D,
  ctxPaths: CanvasRenderingContext2D,
  isRunningRef: Ref<boolean>,
  width: number,
  height: number
): void {
  let gameState = resetGameState();

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

  function drawPlayer(): void {
    const { player } = gameState;
    const { x: prevX, y: prevY } = player.position;
    const rotationDelta = gameState.timeDelta * ROTATION_SPEED;
    let angle = player.angle;
    if (gameState.keysPressed.ArrowLeft) {
      angle -= rotationDelta;
    } else if (gameState.keysPressed.ArrowRight) {
      angle += rotationDelta;
    }
    const rotation = degreeToRad(angle);
    // calculate next position

    const x = prevX + Math.cos(rotation) * (gameState.timeDelta * player.speed);
    const y = prevY + Math.sin(rotation) * (gameState.timeDelta * player.speed);

    // circle
    const radius = PLAYER_SIZE / 2;
    ctxPlayers.beginPath();
    ctxPlayers.ellipse(x, y, radius, radius, 0, 0, 2 * Math.PI);
    ctxPlayers.stroke();

    ctxPlayers.beginPath();
    /* number of vertices for polygon */
    const sides = 3;
    /* angle between vertices of polygon */
    const triangleAngle = (Math.PI * 2) / sides;
    const playerPoints = [];
    for (let i = 0; i < sides; i++) {
      const point = {
        x: x + radius * Math.cos(triangleAngle * i + rotation),
        y: y + radius * Math.sin(triangleAngle * i + rotation)
      };
      playerPoints.push(point);
      ctxPlayers.lineTo(point.x, point.y);
    }

    ctxPlayers.closePath();
    ctxPlayers.stroke();

    ctxPaths.beginPath();
    for (const point of player.path) {
      ctxPaths.lineTo(point.x, point.y);
    }
    const collisionDetected = playerPoints.some(point =>
      ctxPaths.isPointInStroke(point.x, point.y)
    );
    if (collisionDetected) {
      console.log('crashed');
      gameState = resetGameState();
      clearCanvas(ctxPaths, width, height);
      return;
    }

    ctxPaths.stroke();

    gameState.player.path.push({ x, y });

    gameState = {
      ...gameState,
      player: {
        ...gameState.player,
        angle,
        position: {
          x,
          y
        }
      }
    };
  }

  function draw(): void {
    clearCanvas(ctxPlayers, width, height);
    drawPlayer();
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

const Home: FunctionalComponent = () => {
  const playerCanvasRef = useRef<HTMLCanvasElement>();
  const pathCanvasRef = useRef<HTMLCanvasElement>();
  const gameRef = useRef<boolean>(false);
  const width = 1000;
  const height = 800;

  useEffect(() => {
    const ctxPlayerCanvas = playerCanvasRef.current?.getContext('2d');
    const ctxPathCanvas = pathCanvasRef.current?.getContext('2d');
    if (!ctxPlayerCanvas || !ctxPathCanvas) {
      return;
    }
    initGame(ctxPlayerCanvas, ctxPathCanvas, gameRef, width, height);
  }, [playerCanvasRef, pathCanvasRef, gameRef]);

  function startGame(): void {
    gameRef.current = true;
  }

  function pauseGame(): void {
    gameRef.current = false;
  }

  return (
    <div class={style.home}>
      <button onClick={startGame}>Start Game</button>
      <button onClick={pauseGame}>Pause Game</button>
      <div class={style.gameArea}>
        <canvas
          class={style.pathCanvas}
          width={width}
          height={height}
          ref={pathCanvasRef}
        />
        <canvas
          class={style.playerCanvas}
          width={width}
          height={height}
          ref={playerCanvasRef}
        />
      </div>
    </div>
  );
};

export default Home;
