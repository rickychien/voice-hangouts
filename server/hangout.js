const uuidv4 = require('uuid/v4');

class Hangout {
  constructor(wsClients) {
    this.wsClients = wsClients;
  }

  send(ws, data) {
    ws.send(JSON.stringify(data));
  }

  sendToPeer(type, ws, payload) {
    const { peerId } = payload;

    for (let wsClient of this.wsClients) {
      if (wsClient.uid === peerId) {
        this.send(wsClient, {
          type,
          payload: {
            peerId: ws.uid,
            userName: ws.userName,
            [type]: payload[type],
          },
        });

        console.info(`[Send] '${ws.userName}' sent '${type}' to user '${wsClient.userName}'`);
      }
    }
  }

  broadcastToRoomPeers(type, ws, payload) {
    for (let wsClient of this.wsClients) {
      if (wsClient.roomName === ws.roomName && wsClient.uid !== ws.uid) {
        this.send(wsClient, {
          type,
          payload: {
            peerId: ws.uid,
            userName: ws.userName,
            roomName: ws.roomName,
            ...payload,
          },
        });
      }
    }

    console.info(`[Broadcast] '${ws.userName}' broadcasted '${type}' to all peers in room '${ws.roomName}'.`);
  }

  onMessage(ws, message) {
    const { type, payload } = JSON.parse(message);
    this[`onClient${type[0].toUpperCase() + type.slice(1)}`](ws, payload);
  }

  onClientJoin(ws, payload) {
    const { roomName, userName } = payload;

    // Generate unique user id for the new client
    const uid = uuidv4();

    // Store the client
    ws.uid = uid;
    ws.userName = userName;
    ws.roomName = roomName;

    // Send vaild uid back to client
    this.send(ws, {
      type: 'joined',
      payload: {
        uid,
        userName,
        roomName,
      },
    });

    this.broadcastToRoomPeers('peer joined', ws);
  }

  onClientOffer(ws, payload) {
    this.sendToPeer('offer', ws, payload);
  }

  onClientAnswer(ws, payload) {
    this.sendToPeer('answer', ws, payload);
  }

  onClientCandidate(ws, payload) {
    this.sendToPeer('candidate', ws, payload);
  }

  onClientMessage(ws, payload) {
    this.broadcastToRoomPeers('message', ws, payload);
  }

  onClientLeave(ws) {
    this.broadcastToRoomPeers('peer left', ws);
  }
}

module.exports = Hangout;
