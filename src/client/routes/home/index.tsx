import { FunctionalComponent, h } from 'preact';
import { Ref, useEffect, useRef } from 'preact/hooks';
import * as style from './style.css';

interface GameState {
  lastTimeStamp?: number;
  timeDelta: number;
  players: Player[];
  keysPressed: { ArrowLeft: boolean; ArrowRight: boolean };
}
interface Player {
  color: string;
  state: PlayerState;
  speed: number;
  angle: number;
  position: Point;
  playerTriangle?: [Point, Point, Point];
  path: PlayerPathPoint[];
}

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

type CrashedState = BaseState & {
  name: 'CRASHED';
  crashedAt: number;
};

type PlayerState = AliveState | FlyingState | CrashedState;

type Point = {
  x: number;
  y: number;
};

type PlayerPathPoint = Point & {
  gap: boolean;
};

const PLAYER_SPEED = 0.08;
const ROTATION_SPEED = 0.15;
const PLAYER_SIZE = 12;
const GAP_TIME_MIN = 6000;
const GAP_TIME_MAX = 10000;
/** The time duration used for a gap in ms */
const GAP_TIME = 250;

const START_POSITION_MIN_EDGE_DISTANCE = 150;

function degreeToRad(degree: number): number {
  return (degree * Math.PI) / 180;
}

function getRandomNumberBetween(min: number, max: number): number {
  return Math.random() * (max - min) + min;
}

function getRandomGapTiming(): number {
  return getRandomNumberBetween(GAP_TIME_MAX, GAP_TIME_MIN);
}

function getRandomStartPosition(width: number, height: number): Point {
  return {
    x: getRandomNumberBetween(START_POSITION_MIN_EDGE_DISTANCE, width - START_POSITION_MIN_EDGE_DISTANCE),
    y: getRandomNumberBetween(START_POSITION_MIN_EDGE_DISTANCE, height - START_POSITION_MIN_EDGE_DISTANCE)
  };
}

function isPointInTriangle(point: Point, triangle: [Point, Point, Point]): boolean {
  const [p1, p2, p3] = triangle;

  const denominator = (p2.y - p3.y) * (p1.x - p3.x) + (p3.x - p2.x) * (p1.y - p3.y);
  const a = ((p2.y - p3.y) * (point.x - p3.x) + (p3.x - p2.x) * (point.y - p3.y)) / denominator;
  const b = ((p3.y - p1.y) * (point.x - p3.x) + (p1.x - p3.x) * (point.y - p3.y)) / denominator;
  const c = 1 - a - b;

  return 0 <= a && a <= 1 && 0 <= b && b <= 1 && 0 <= c && c <= 1;
}

function clearCanvas(ctx: CanvasRenderingContext2D, width: number, height: number): void {
  ctx.clearRect(0, 0, width, height);
}

function isPointOutsideOfPlayingField(point: Point, width: number, height: number): boolean {
  return point.x < 0 || point.y < 0 || point.x > width || point.y > height;
}

function resetGameState(width: number, height: number): GameState {
  return {
    timeDelta: 0,
    players: [
      {
        state: { name: 'ALIVE', groundedUntil: new Date().getTime() + getRandomGapTiming() },
        speed: PLAYER_SPEED,
        angle: getRandomNumberBetween(0, 359),
        position: getRandomStartPosition(width, height),
        path: [],
        color: 'red',
      },
      {
        state: { name: 'ALIVE', groundedUntil: new Date().getTime() + getRandomGapTiming() },
        speed: PLAYER_SPEED,
        angle: getRandomNumberBetween(0, 359),
        position: getRandomStartPosition(width, height),
        path: [],
        color: 'blue',
      }
    ],
    keysPressed: {
      ArrowLeft: false,
      ArrowRight: false
    }
  };
}

function initGame(ctx: CanvasRenderingContext2D, isRunningRef: Ref<boolean>, width: number, height: number): void {
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
  }

  function drawPlayer(player: Player): Player {
    let { x, y } = player.position;
    let { angle } = player;
    const playerPoints: Point[] = [];
    ctx.strokeStyle = player.color;

    if (player.state.name !== 'CRASHED') {
      const rotationDelta = gameState.timeDelta * ROTATION_SPEED;
      if (gameState.keysPressed.ArrowLeft) {
        angle -= rotationDelta;
      } else if (gameState.keysPressed.ArrowRight) {
        angle += rotationDelta;
      }
      const rotation = degreeToRad(angle);
      // calculate next position

      x = x + Math.cos(rotation) * (gameState.timeDelta * player.speed);
      y = y + Math.sin(rotation) * (gameState.timeDelta * player.speed);

      // circle
      const radius = PLAYER_SIZE / 2;

      // Shift the centroid of the triangle with the current rotation
      // so that the player position is at the edge of the triangle
      const shiftedPoint = {
        x: x + (Math.cos(rotation) * (radius + 0.1)) / 2,
        y: y + (Math.sin(rotation) * (radius + 0.1)) / 2
      };

      ctx.beginPath();
      /* number of vertices for polygon */
      const sides = 3;
      /* angle between vertices of polygon */
      const triangleAngle = (Math.PI * 2) / sides;

      for (let i = 0; i < sides; i++) {
        const point = {
          x: shiftedPoint.x + radius * Math.cos(triangleAngle * i + rotation),
          y: shiftedPoint.y + radius * Math.sin(triangleAngle * i + rotation)
        };
        playerPoints.push(point);
        ctx.lineTo(point.x, point.y);
      }

      ctx.closePath();
      ctx.stroke();
    }

    // draw path
    ctx.beginPath();
    for (const point of player.path) {
      point.gap ? ctx.moveTo(point.x, point.y) : ctx.lineTo(point.x, point.y);
    }
    ctx.stroke();

    const currentTime = new Date().getTime();

    let nextState: PlayerState = player.state;
    if (player.state.name === 'FLYING') {
      player.path.push({
        x,
        y,
        gap: true
      });
      const shouldBeGrounded = currentTime > player.state.flyingUntil;
      if (shouldBeGrounded) {
        nextState = { name: 'ALIVE', groundedUntil: currentTime + getRandomGapTiming() };
      }
    } else if (player.state.name === 'ALIVE') {
      const shouldCreateGap = currentTime > player.state.groundedUntil;
      if (shouldCreateGap) {
        nextState = { name: 'FLYING', flyingUntil: currentTime + GAP_TIME };
      }
      player.path.push({
        x,
        y,
        gap: shouldCreateGap
      });
    }
    return {
      ...player,
      state: nextState,
      angle,
      position: {
        x,
        y
      },
      playerTriangle: playerPoints as [Point, Point, Point],
    };
  }

  function draw(): void {
    clearCanvas(ctx, width, height);
    let players: Player[] = gameState.players
      .map(player => drawPlayer(player));

    players = players
      .map((me) => {

        // early exit if i am already crashed
        if (me.state.name == 'CRASHED') {
          return me;
        }
        // If the player is not crashed - we know that there is a playerTriangle defined.
        // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
        const triangle = me.playerTriangle!;

        const isOutsidePlayingField = triangle.some((point) => isPointOutsideOfPlayingField(point, width, height));

        // loop over all players and there path points and check whether
        // any of their points is inside my players triangle if so 
        // i crashed either into myself or one of my enemies
        const isCrashed = isOutsidePlayingField || players.some((otherPlayer) => {
          return otherPlayer.path.some((point) => {
            return isPointInTriangle(point, triangle);
          });
        });

        return isCrashed ? { ...me, state: { name: 'CRASHED', crashedAt: new Date().getTime() } } : me;
      });

    if (players.every(player => player.state.name === 'CRASHED')) {
      resetGame();
      return;
    }

    gameState = {
      ...gameState,
      players
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
