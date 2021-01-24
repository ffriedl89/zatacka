import { FunctionalComponent, h } from 'preact';
import { useContext, useMemo, useRef, useState } from 'preact/hooks';
// import { Client, Host } from '../../comms';
import { CommunicationContext } from '../../comms/communication-provider';
import * as style from './style.css';


const Lobby: FunctionalComponent = () => {
    const context = useContext(CommunicationContext);
    console.log('Context', context);
    const [lobbyId, setLobbyId] = useState('');
    const [userName, setUserName] = useState('');

    // const host = useRef<Host>();
    // const client = useRef<Client>();

    // const userDependency = host?.current?.users ?? [];
    // const lobbyUsers = useMemo<Array<string>>(() => {
    //     console.log('memo hook called');
    //     return host?.current?.users ?? []
    // }, [userDependency]);


    function createLobby(): void {
        // host.current = new Host(() => {
        //     setLobbyId(host.current.lobbyId);
        // });
    }

    function joinLobby(): void {
        // client.current = new Client(lobbyId);
    }

    return (<div class={style.lobby}>
        <button onClick={createLobby}>Create lobby</button>
        <input type="text" value={lobbyId} onChange={(e: any) => setLobbyId(e.target.value)} />
        <button onClick={joinLobby}>Join lobby</button>

        <input type="text" value={userName} onChange={(e: any) => setUserName(e.target.value)} />

        {/* {lobbyUsers.map(user => <li key={user}>{user}</li>)} */}
    </div>)
}

export default Lobby;