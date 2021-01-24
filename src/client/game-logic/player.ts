import { PlayerPathPoint, Point } from './points';
import { GAP_TIME, PLAYER_SIZE, ROTATION_SPEED } from './game-settings';
import { degreeToRad } from './helpers/trigonometry';
import { GameState } from './game-state';
import { getRandomGapTiming } from './helpers/randomize';

export interface Player {
  id: string;
  color: string;
  state: PlayerState;
  speed: number;
  angle: number;
  position: Point;
  playerTriangle?: [Point, Point, Point];
  path: PlayerPathPoint[];
}

type BaseState = {
  type: string;
};

type GroundedState = BaseState & {
  type: 'GROUNDED';
  groundedUntil: number;
};

type FlyingState = BaseState & {
  type: 'FLYING';
  flyingUntil: number;
};

type CrashedState = BaseState & {
  type: 'CRASHED';
  crashedAt: number;
};

type PlayerState = GroundedState | FlyingState | CrashedState;

export function drawPlayer(player: Player, ctx: CanvasRenderingContext2D, gameState: GameState): Player {
  let { x, y } = player.position;
  let { angle } = player;
  const playerPoints: Point[] = [];
  ctx.strokeStyle = player.color;

  if (player.state.type !== 'CRASHED') {
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
  if (player.state.type === 'FLYING') {
    player.path.push({
      x,
      y,
      gap: true
    });
    const shouldBeGrounded = currentTime > player.state.flyingUntil;
    if (shouldBeGrounded) {
      nextState = { type: 'GROUNDED', groundedUntil: currentTime + getRandomGapTiming() };
    }
  } else if (player.state.type === 'GROUNDED') {
    const shouldCreateGap = currentTime > player.state.groundedUntil;
    if (shouldCreateGap) {
      nextState = { type: 'FLYING', flyingUntil: currentTime + GAP_TIME };
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
    playerTriangle: playerPoints as [Point, Point, Point]
  };
}
