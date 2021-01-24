import Peer from 'peerjs';

export class Host {
  /** Global peer connection */
  peer: Peer;

  /** Defines the public id of the lobby */
  lobbyId = '';

  /** List of data connections to the clients */
  connections: Peer.DataConnection[] = [];

  constructor(onLobbyOpen: () => void) {
    this.peer = new Peer(undefined, {
      debug: 3
    });

    this.peer.on('open', id => {
      this.lobbyId = id;
      onLobbyOpen();
    });

    this.peer.on('connection', dataConnection => {
      console.log('Connected to: ' + dataConnection.peer);
      dataConnection.on('data', data => {
        console.log('DATAAA', data);
      });
    });
  }
}
