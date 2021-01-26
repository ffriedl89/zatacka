import Peer from 'peerjs';
import { USER_JOINED } from './comm-signs';

export class Client {
  peer: Peer;

  connection: Peer.DataConnection | null = null;

  constructor(_lobbyId: string) {
    this.peer = new Peer(undefined, { debug: 2 });

    this.peer.on('open', id => {
      console.log('Peer connection opened', id);

      this.connection = this.peer.connect(_lobbyId, { reliable: true });
      console.log('Connecting to lobby', _lobbyId);
      this.connection.on('open', () => {
        console.log('Client connection opened');
        this.connection?.send({ type: USER_JOINED, username: 'johnny' });
      });
    });
  }
}
