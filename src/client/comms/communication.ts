import Peer from 'peerjs';
import { StateUpdater } from 'preact/hooks';
import { GameState } from '../game-logic/game-state';
import { PlayerTransferData } from '../game-logic/player';
import { PowerUpTransferData } from '../game-logic/powerups';
import {
  CLIENT_GAME_STAGED,
  SET_USER_LIST,
  SET_USER_NAME,
  GO_TO_GAMESCREEN,
  START_GAME,
  SHARE_GAME_STATE
} from './comm-signs';

export interface TransferGameState {
  powerUpState: {
    powerUps: PowerUpTransferData[];
    nextPowerUpTimestamp: number;
  };
  players: PlayerTransferData[];
}

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
    if (!this.host) {
      this.connections[0].send({ type: SET_USER_NAME, data: username });
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
      this.connections[0].send({ type: CLIENT_GAME_STAGED });
    }
  }

  private connections: Peer.DataConnection[] = [];

  /**
   * Metadata map connecting a DataConnection to a user
   * Primarily used by the host.
   * */
  private _metaMap = new Map<string, { username?: string; staged?: boolean }>();

  constructor(public host: boolean) {
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
      this.connections = [this._peer.connect(this.lobbyId, { reliable: false })];
      this.connections[0].on('open', () => {
        this._clientReady();
      });
      this.connections[0].on('error', err => {
        console.log('Client error', err);
      });
    });
  }

  onEverybodyStaged(fn: () => void): void {
    fn();
  }

  // Function set by a client to get updates from the game
  // state
  clientGameStateUpdate?: (gameState: TransferGameState) => void;

  syncGameState(gameState: GameState): void {
    const transferrableGameState: TransferGameState = {
      powerUpState: {
        powerUps: gameState.powerUpState.powerUps.map(powerUp => powerUp.transferData),
        nextPowerUpTimestamp: gameState.powerUpState.nextPowerUpTimestamp
      },
      players: Object.values(gameState.players).map(player => player.transferData)
    };
    this._sendEventToClients(SHARE_GAME_STATE, transferrableGameState);
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
      this.connections.push(dataConnection);
      this._metaMap.set(dataConnection.peer, {});
    });
  }

  private _clientReady(): void {
    const connection = this.connections[0];
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
      if (evtData.type === SHARE_GAME_STATE && this.clientGameStateUpdate) {
        console.log('share game state message');
        this.clientGameStateUpdate(evtData.data);
        return;
      }
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
    for (const connection of this.connections) {
      connection.send({ type: event, data: eventData });
    }
  }
}
