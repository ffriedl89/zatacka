import Peer from 'peerjs';
import { StateUpdater } from 'preact/hooks';
import { SET_USER_LIST, SET_USER_NAME } from './comm-signs';

export class Communication {
  /** Global peer connection */
  private _peer: Peer;

  // Setters and connections to the lobbyID
  lobbyId = '';
  setLobbyId?: StateUpdater<string>;

  // Setters and connections for the Username
  userName = '';
  setUserName?: StateUpdater<string>;
  changeUserName(username: string): void {
    if (this.setUserName) {
      console.log('username', username);
      this.setUserName(username);
    }
    // If we are on a client, send the update to the host
    if (!this._host) {
      this.connections[0].send({ type: SET_USER_NAME, data: username });
    } else {
      this.userName = username;
      this._updateMembersList();
    }
  }

  setLobbyUsers?: StateUpdater<Array<{ username: string; host: boolean }>>;

  private connections: Peer.DataConnection[] = [];

  /**
   * Metadata map connecting a DataConnection to a user
   * Primarily used by the host.
   * */
  private _metaMap = new Map<string, { username?: string }>();

  constructor(private _host: boolean) {
    this._peer = new Peer(undefined, { debug: 2 });
  }

  openLobby(): void {
    this._peer.on('open', id => {
      this.lobbyId = id;
      if (this.setLobbyId) {
        this.setLobbyId(this.lobbyId);
      }
      this._hostReady();
    });
  }

  joinLobby(lobbyId: string): void {
    this.lobbyId = lobbyId;
    this._peer.on('open', id => {
      this.connections = [this._peer.connect(this.lobbyId, { reliable: true })];
      this.connections[0].on('open', () => {
        this._clientReady();
      });
    });
  }

  private _hostReady(): void {
    this._peer.on('connection', dataConnection => {
      dataConnection.on('data', evtData => {
        console.log('Recieved data from client', evtData);
        if (evtData.type === SET_USER_NAME) {
          const meta = this._metaMap.get(dataConnection.peer);
          if (meta) {
            meta.username = evtData.data;
            this._metaMap.set(dataConnection.peer, meta);
            console.log(this._metaMap);
            this._updateMembersList();
          }
          return;
        }
      });
      this.connections.push(dataConnection);
      this._metaMap.set(dataConnection.peer, {});
    });
  }

  private _clientReady(): void {
    const connection = this.connections[0];
    connection.on('data', evtData => {
      console.log('Recieved data from host', evtData);
      if (evtData.type === SET_USER_LIST && this.setLobbyUsers) {
        this.setLobbyUsers(evtData.data);
        return;
      }
    });
  }

  private _updateMembersList(): void {
    const users = [{ username: this.userName, host: true }];
    for (const user of this._metaMap.values()) {
      users.push({ username: user.username ?? '', host: false });
    }
    // Set it for the host
    if (this.setLobbyUsers) {
      this.setLobbyUsers(users);
    }
    // send the update to the client
    this._sendEventToClients(SET_USER_LIST, users);
  }

  private _sendEventToClients(event: string, eventData: unknown): void {
    for (const connection of this.connections) {
      connection.send({ type: event, data: eventData });
    }
  }
}
