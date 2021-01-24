// import Peer from 'peerjs';
// import { USER_JOINED } from './comm-signs';

// export class Host {
//   /** Global peer connection */
//   private _peer: Peer;

//   /** Defines the public id of the lobby */
//   lobbyId = '';

//   private _participants: { username: string; connection: Peer.DataConnection }[] = [];

//   constructor(onLobbyOpen: () => void) {
//     this._peer = new Peer(undefined, {
//       debug: 2
//     });

//     this._peer.on('open', id => {
//       this.lobbyId = id;
//       onLobbyOpen();
//     });

//     this._peer.on('connection', dataConnection => {
//       console.log('Connected to: ' + dataConnection.peer);
//       dataConnection.on('data', data => {
//         console.log(data);
//         switch (data.type) {
//           case USER_JOINED:
//             this._userJoined(dataConnection, data.username);
//             break;
//         }
//       });
//     });
//   }

//   private _userJoined(connection: Peer.DataConnection, username: string): void {
//     const foundUser = this._participants.find(el => el.connection.peer === connection.peer);
//     if (!foundUser) {
//       this._participants.push({ username, connection });
//     } else {
//       foundUser.username = username;
//     }
//     console.log(this._participants);
//   }

//   get users(): string[] {
//     return this._participants.map(p => p.username);
//   }
// }
