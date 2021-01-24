import Peer from 'peerjs';

export class Client {
  peer: Peer;

  connection: Peer.DataConnection;

  constructor(_lobbyId: string) {
    this.peer = new Peer(undefined, { debug: 3 });

    this.connection = this.peer.connect(_lobbyId, { reliable: true });
    console.log('Connecting to lobby', _lobbyId);
    this.connection.on('open', () => {
      console.log('Client connection opened');
    });
  }
}
