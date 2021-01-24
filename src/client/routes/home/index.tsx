import { FunctionalComponent, h } from 'preact';
import { useEffect, useRef, useState } from 'preact/hooks';
import { GameControls, initGame } from '../../game-logic/game';

import * as style from './style.css';

const Home: FunctionalComponent = () => {
  const canvasRef = useRef<HTMLCanvasElement>();
  const [controls, setControls] = useState<GameControls>({
    startGame: () => {},
    pauseGame: () => {},
    resetGame: () => {}
  });
  const width = 1000;
  const height = 800;

  useEffect(() => {
    const ctxPlayerCanvas = canvasRef.current?.getContext('2d');
    if (!ctxPlayerCanvas) {
      return;
    }
    setControls(initGame(ctxPlayerCanvas, width, height));
  }, []);

  return (
    <div class={style.home}>
      <button onClick={controls.startGame}>Start Game</button>
      <button onClick={controls.pauseGame}>Pause Game</button>
      <button onClick={controls.resetGame}>Reset Game</button>
      <canvas class={style.canvas} width={width} height={height} ref={canvasRef} />
    </div>
  );
};

export default Home;
