import { FunctionalComponent, h } from 'preact';
import { Ref, useEffect, useRef } from 'preact/hooks';
import * as style from './style.css';

interface GameState {
  lastTimeStamp?: number;
  timeDelta: number;
  player: Player;
  keysPressed: { ArrowLeft: boolean; ArrowRight: boolean };
}
interface Player {
  state: PlayerState;
  speed: number;
  angle: number;
  position: Point;
  path: PlayerPathPoint[];
}

type StateKind = PlayerState['name'];

type BaseState = {
  name: string;
};

type AliveState = BaseState & {
  name: 'ALIVE';
  groundedUntil: number;
};

type FlyingState = BaseState & {
  name: 'FLYING';
  flyingUntil: number;
};

type PlayerState = AliveState | FlyingState;

interface Point {
  x: number;
  y: number;
}

interface PlayerPathPoint extends Point {
  gap: boolean;
}

const PLAYER_SPEED = 0.08;
const ROTATION_SPEED = 0.15;
const PLAYER_SIZE = 12;
const GAP_TIME_MIN = 6000;
const GAP_TIME_MAX = 10000;
/** The time duration used for a gap in ms */
const GAP_TIME = 250;

function degreeToRad(degree: number): number {
  return (degree * Math.PI) / 180;
}

function getRandomGapTiming(): number {
  return Math.random() * (GAP_TIME_MAX - GAP_TIME_MIN) + GAP_TIME_MIN;
}

function clearCanvas(ctx: CanvasRenderingContext2D, width: number, height: number): void {
  ctx.clearRect(0, 0, width, height);
}

function resetGameState(): GameState {
  return {
    timeDelta: 0,
    player: {
      state: { name: 'ALIVE', groundedUntil: new Date().getTime() + getRandomGapTiming() },
      speed: PLAYER_SPEED,
      angle: 0,
      position: {
        x: 200,
        y: 200
      },
      path: [],
    },
    keysPressed: {
      ArrowLeft: false,
      ArrowRight: false
    }
  };
}

function initGame(ctx: CanvasRenderingContext2D, isRunningRef: Ref<boolean>, width: number, height: number): void {
  let gameState = resetGameState();
  console.log(gameState);

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
    ctx.beginPath();
    ctx.ellipse(x, y, radius, radius, 0, 0, 2 * Math.PI);
    ctx.stroke();

    ctx.beginPath();
    /* number of vertices for polygon */
    const sides = 3;
    /* angle between vertices of polygon */
    const triangleAngle = (Math.PI * 2) / sides;
    const playerPoints: Point[] = [];
    for (let i = 0; i < sides; i++) {
      const point = {
        x: x + radius * Math.cos(triangleAngle * i + rotation),
        y: y + radius * Math.sin(triangleAngle * i + rotation)
      };
      playerPoints.push(point);
      ctx.lineTo(point.x, point.y);
    }

    ctx.closePath();
    ctx.stroke();

    // draw path
    ctx.beginPath();
    for (const point of player.path) {
      point.gap ? ctx.moveTo(point.x, point.y) : ctx.lineTo(point.x, point.y);
    }


    const collisionDetected = player.state.name === 'ALIVE' && playerPoints.some(point => ctx.isPointInStroke(point.x, point.y));
    if (collisionDetected) {
      gameState = resetGameState();
      clearCanvas(ctx, width, height);
      return;
    }
    ctx.stroke();

    const currentTime = new Date().getTime();
    let nextState: PlayerState = player.state;
    if (player.state.name === 'FLYING') {
      gameState.player.path.push({
        x,
        y,
        gap: true
      });
      const shouldBeGrounded = currentTime > player.state.flyingUntil;
      if (shouldBeGrounded) {
        nextState = { name: 'ALIVE', groundedUntil: currentTime + getRandomGapTiming() }
      }
    } else if (player.state.name === 'ALIVE') {
      const shouldCreateGap = currentTime > player.state.groundedUntil;
      if (shouldCreateGap) {
        nextState = { name: 'FLYING', flyingUntil: currentTime + GAP_TIME };
        console.log(nextState);
      }
      gameState.player.path.push({
        x,
        y,
        gap: shouldCreateGap
      });
    }

    gameState = {
      ...gameState,
      player: {
        ...gameState.player,
        state: nextState,
        angle,
        position: {
          x,
          y
        }
      }
    };
  }

  function draw(): void {
    clearCanvas(ctx, width, height);
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
  const canvasRef = useRef<HTMLCanvasElement>();
  const gameRef = useRef<boolean>(false);
  const width = 1000;
  const height = 800;

  useEffect(() => {
    const ctxPlayerCanvas = canvasRef.current?.getContext('2d');
    if (!ctxPlayerCanvas) {
      return;
    }
    initGame(ctxPlayerCanvas, gameRef, width, height);
  }, [canvasRef, gameRef]);

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
      <canvas class={style.canvas} width={width} height={height} ref={canvasRef} />
    </div>
  );
};

export default Home;
