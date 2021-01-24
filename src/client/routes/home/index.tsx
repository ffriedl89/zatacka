import { FunctionalComponent, h } from 'preact';
import { useEffect, useRef } from 'preact/hooks';
import { initGame } from '../../game-logic/game';

import * as style from './style.css';

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
