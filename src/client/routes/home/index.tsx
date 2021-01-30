import { FunctionalComponent, h } from 'preact';
import { useEffect, useRef, useState } from 'preact/hooks';
import { GameControls, initGame } from '../../game-logic/game';
import { Player } from '../../game-logic/player';

import * as style from './style.css';

const Home: FunctionalComponent = () => {
  const canvasRef = useRef<HTMLCanvasElement>();
  const [players, setPlayers] = useState<Record<string, Player>>({});

  const [controls, setControls] = useState<GameControls>({
    startGame: () => {},
    pauseGame: () => {},
    resetGame: () => {}
  });
  const width = 1000;
  const height = 800;

  useEffect(() => {
    const playerCanvas = canvasRef.current;
    setControls(initGame(playerCanvas, width, height));

    function handleScoreChange(event: CustomEvent<Player>): void {
      setPlayers({ ...players, [event.detail.id]: event.detail });
    }

    playerCanvas.addEventListener('playerscorechange', handleScoreChange);

    return (): void => playerCanvas.removeEventListener('playerscorechange', handleScoreChange);
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
