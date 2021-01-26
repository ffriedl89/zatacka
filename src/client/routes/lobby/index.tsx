import { FunctionalComponent, h } from 'preact';
import { useRef, useState } from 'preact/hooks';
import { Client, Host } from '../../comms';
import { Communication } from '../../comms/communication';
import * as style from './style.css';

const Lobby: FunctionalComponent = () => {
    const [lobbyId, setLobbyId] = useState('');
    const [userName, setUserName] = useState('');
    const [isHost, setIsHost] = useState(false);

    const communication = useRef<Communication>();

    const [lobbyUsers, setLobbyUsers] = useState<Array<{ username: string; host: boolean }>>([]);

    function createLobby(): void {
        setIsHost(true);
        const comms = new Communication(true);
        comms.setLobbyId = setLobbyId;
        comms.setUserName = setUserName;
        comms.setLobbyUsers = setLobbyUsers;
        comms.openLobby();
        // We will probably need to persist this into the window
        // to share this commication instance over to the game afterwards.
        communication.current = comms;
    }

    function joinLobby(): void {
        setIsHost(false);
        const comms = new Communication(false);
        comms.setUserName = setUserName;
        comms.setLobbyUsers = setLobbyUsers;
        comms.joinLobby(lobbyId);
        communication.current = comms;
    }

    return (<div class={style.lobby}>
        <button onClick={createLobby}>Create lobby</button>
        <input type="text" value={lobbyId} onChange={(e: any) => setLobbyId(e.target.value)} />
        <button onClick={joinLobby}>Join lobby</button>

        <input type="text" value={userName} onKeyUp={(e: any) => communication.current.changeUserName(e.target.value)} />

        {lobbyUsers.map(user => <li key={user.username}>{user.username}{user.host && ' (H)'}</li>)}
    </div>)
}

export default Lobby;