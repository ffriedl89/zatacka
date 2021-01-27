import { FunctionalComponent, h } from 'preact';
import { route } from 'preact-router';
import { useRef, useState } from 'preact/hooks';
import { Communication } from '../../comms/communication';
import * as style from './style.css';

const Lobby: FunctionalComponent = () => {
    const [lobbyId, setLobbyId] = useState('');
    const [userName, setUserName] = useState('');
    const [isHost, setIsHost] = useState(false);

    const communication = useRef<Communication>();

    const [lobbyUsers, setLobbyUsers] = useState<Array<{ username: string; host: boolean }>>([]);

    function goToGameScreen(): void {
        (window as any).gameConnection = communication.current;
        route('/');
    }

    function createLobby(): void {
        setIsHost(true);
        const comms = new Communication(true);
        comms.setLobbyId = setLobbyId;
        comms.setUserName = setUserName;
        comms.setLobbyUsers = setLobbyUsers;
        comms.goToGameScreen = goToGameScreen;
        comms.openLobby();
        // We will probably need to persist this into the window
        // to share this commication instance over to the game afterwards.
        communication.current = comms;
        // Dummy user add to fill it out
        communication.current.changeUserName('Host user');
    }

    function joinLobby(): void {
        setIsHost(false);
        const comms = new Communication(false);
        comms.setUserName = setUserName;
        comms.setLobbyUsers = setLobbyUsers;
        comms.goToGameScreen = goToGameScreen;
        comms.joinLobby(lobbyId);
        communication.current = comms;
        // Dummy user add to fill it out
        communication.current.changeUserName('Client user');
    }

    return (<div class={style.lobby}>
        <button onClick={createLobby}>Create lobby</button>
        <input type="text" value={lobbyId} onChange={(e: any) => setLobbyId(e.target.value)} />
        <button onClick={joinLobby}>Join lobby</button>

        <input type="text" value={userName} onKeyUp={(e: any) => communication.current.changeUserName(e.target.value)} />

        {lobbyUsers.map(user => <li key={user.username}>{user.username}{user.host && ' (H)'}</li>)}

        {isHost && <button onClick={() => communication.current.triggerGoToGameScreen()}>Start game</button>}
    </div>)
}

export default Lobby;