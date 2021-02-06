import Peer from 'peerjs';
import { StateUpdater } from 'preact/hooks';
import { GameState } from '../game-logic/game-state';
import { PlayerTransferData } from '../game-logic/player';
import { PowerUp, PowerUpTransferData } from '../game-logic/powerups';
import {
  CLIENT_GAME_STAGED,
  SET_USER_LIST,
  SET_USER_NAME,
  GO_TO_GAMESCREEN,
  START_GAME,
  SHARE_GAME_STATE,
  POWER_UP_ADDED,
  POWER_UP_REMOVED
} from './comm-signs';

export class Communication {
  /** Global peer connection */
  _peer: Peer;

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
    if (!this.host) {
      this._connections[0].send({ type: SET_USER_NAME, data: username });
    } else {
      this.userName = username;
      this._updateMembersList();
    }
  }

  setLobbyUsers?: StateUpdater<Array<{ username: string; host: boolean }>>;

  // Setters and connection for starting a game
  goToGameScreen?: () => void;
  triggerGoToGameScreen() {
    if (this.host && this.goToGameScreen) {
      this._sendEventToClients(GO_TO_GAMESCREEN, true);
      this.goToGameScreen();
    }
  }

  startGame?: () => void;
  syncStart(): void {
    if (!this.host) {
      this._connections[0].send({ type: CLIENT_GAME_STAGED });
    }
  }

  playerToConnectionMap = new Map<string, string>();

  _connections: Peer.DataConnection[] = [];

  /**
   * Metadata map connecting a DataConnection to a user
   * Primarily used by the host.
   * */
  private _metaMap = new Map<string, { username?: string; staged?: boolean }>();

  constructor(public host: boolean) {
    this._peer = new Peer(undefined, { debug: 2 });
    this._peer.on('error', err => console.log('Root peer err', err));
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
      this._connections = [this._peer.connect(this.lobbyId, { reliable: false })];
      this._connections[0].on('open', () => {
        this._clientReady();
      });
      this._connections[0].on('error', err => {
        console.log('Client error', err);
      });
    });
  }

  onEverybodyStaged(fn: () => void): void {
    fn();
  }

  // Function set by a client to get updates from the game
  // state
  clientPlayersUpdate?: (players: PlayerTransferData[]) => void;

  syncGameState(gameState: GameState): void {
    const transferablePlayers: PlayerTransferData[] = Object.values(gameState.players).map(
      player => player.transferData
    );

    this._sendEventToClients(SHARE_GAME_STATE, transferablePlayers);
  }

  powerUpAdded?: (powerUp: PowerUpTransferData) => void;

  addPowerUp(powerUp: PowerUp): void {
    this._sendEventToClients(POWER_UP_ADDED, powerUp.transferData);
  }

  powerUpRemoved?: (powerUpId: string) => void;

  removePowerUp(powerUpId: string): void {
    this._sendEventToClients(POWER_UP_REMOVED, powerUpId);
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
            this._updateMembersList();
          }
          return;
        }
        if (evtData.type === CLIENT_GAME_STAGED) {
          const meta = this._metaMap.get(dataConnection.peer);
          if (meta) {
            meta.staged = true;
            this._metaMap.set(dataConnection.peer, meta);
            this._checkForGameStart();
          }
          return;
        }
      });
      this._connections.push(dataConnection);
      this._metaMap.set(dataConnection.peer, {});
    });
  }

  private _clientReady(): void {
    const connection = this._connections[0];
    connection.on('data', evtData => {
      if (evtData.type === SET_USER_LIST && this.setLobbyUsers) {
        this.setLobbyUsers(evtData.data);
        return;
      }
      if (evtData.type === GO_TO_GAMESCREEN && this.goToGameScreen) {
        this.goToGameScreen();
        return;
      }
      if (evtData.type === START_GAME && this.startGame) {
        this.startGame();
        return;
      }
      if (evtData.type === SHARE_GAME_STATE && this.clientPlayersUpdate) {
        this.clientPlayersUpdate(evtData.data);
        return;
      }
      if (evtData.type === POWER_UP_ADDED && this.powerUpAdded) {
        this.powerUpAdded(evtData.data);
        return;
      }
      if (evtData.type === POWER_UP_REMOVED && this.powerUpRemoved) {
        this.powerUpRemoved(evtData.data);
        return;
      }
    });
    connection.on('error', err => {
      console.log('connection error', err);
    });
  }

  // Update the members list
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

  // Check if the game can start
  private _checkForGameStart(): void {
    const allUsersStagedStates: boolean[] = [];
    for (const user of this._metaMap.values()) {
      allUsersStagedStates.push(user.staged!);
    }
    if (allUsersStagedStates.every(e => true)) {
      this._sendEventToClients(START_GAME, true);
      if (this.startGame) {
        this.startGame();
      }
    }
  }

  private _sendEventToClients(event: string, eventData: unknown): void {
    for (const connection of this._connections) {
      connection.send({ type: event, data: eventData });
    }
  }
}
