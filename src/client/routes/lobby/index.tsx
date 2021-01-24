import { FunctionalComponent, h } from 'preact';
import { useRef, useState } from 'preact/hooks';
import { Client, Host } from '../../comms';
import * as style from './style.css';


const Lobby: FunctionalComponent = () => {

    const [lobbyId, setLobbyId] = useState('');
    const host = useRef<Host>();
    const client = useRef<Client>();


    function createLobby(): void {
        host.current = new Host(() => {
            setLobbyId(host.current.lobbyId);
        });
    }

    function joinLobby(): void {
        client.current = new Client(lobbyId);
    }
    console.log(host.current);
    return (<div class={style.lobby}>
        <button onClick={createLobby}>Create lobby</button>
        <input type="text" value={lobbyId} onChange={(e: any) => setLobbyId(e.target.value)} />
        <button onClick={joinLobby}>Join lobby</button>
    </div>)
}

export default Lobby;