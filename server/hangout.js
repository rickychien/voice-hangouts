const uuidv4 = require('uuid/v4');

class Hangout {
  send(ws, data) {
    ws.send(JSON.stringify(data));
  }

  onMessage(wsClients, ws, message) {
    const { type, ...data } = JSON.parse(message);

    switch (type) {
      case 'join': {
        this.onClientJoin(wsClients, ws, data);
        break;
      }
      case 'offer': {
        this.onClientOffer(wsClients, ws, data);
        break;
      }
      case 'answer': {
        this.onClientAnswer(wsClients, ws, data);
        break;
      }
      case 'candidate': {
        this.onClientCandidate(wsClients, ws, data);
        break;
      }
      case 'message': {
        this.onClientMessage(wsClients, ws, data);
        break;
      }
      case 'leave': {
        this.onClientLeave(wsClients, ws, data);
        break;
      }
      default: {
        break;
      }
    }
  }

  onClientJoin(wsClients, ws, data) {
    const { roomName, userName } = data.payload;

    if (wsClients.has(userName)) {
      // Reject client if username has been used.
      this.send(ws, {
        type: 'join',
        payload: {},
        error: `Username ${userName} has been used`,
      });

      console.info(`[User] '${userName}' has been rejected due to same user existed.`);
    } else {
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
        error: null,
      });

      // New peer broadcasts 'peer joined' event to other clients in the same room.
      for (let wsClient of wsClients) {
        if (wsClient.roomName === ws.roomName && wsClient.uid !== ws.uid) {
          this.send(wsClient, {
            type: 'peer joined',
            payload: {
              peerId: ws.uid,
              userName: ws.userName,
            },
            error: null,
          });
        }
      }

      console.info(`[User] '${userName}' joined room '${roomName}'.`);
    }
  }

  onClientOffer(wsClients, ws, data) {
    const { peerId, offer } = data.payload;

    // Send offer to the peer client
    for (let wsClient of wsClients) {
      if (wsClient.uid === peerId) {
        this.send(wsClient, {
          type: 'offer',
          payload: {
            peerId: ws.uid,
            userName: ws.userName,
            offer,
          },
          error: null,
        });

        console.info(`[Signaling] '${ws.userName}'sending an offer to '${wsClient.userName}'`);
      }
    }
  }

  onClientAnswer(wsClients, ws, data) {
    const { peerId, answer } = data.payload;

    // Send answer to the peer client
    for (let wsClient of wsClients) {
      if (wsClient.uid === peerId) {
        this.send(wsClient, {
          type: 'answer',
          payload: {
            peerId: ws.uid,
            userName: ws.userName,
            answer,
          },
          error: null,
        });

        console.info(`[Signaling] '${ws.userName}' sending an answer to '${wsClient.userName}'`);
      }
    }
  }

  onClientCandidate(wsClients, ws, data) {
    const { peerId, candidate } = data.payload;

    // Send candidate to the peer client
    for (let wsClient of wsClients) {
      if (wsClient.uid === peerId) {
        this.send(wsClient, {
          type: 'candidate',
          payload: {
            peerId: ws.uid,
            userName: ws.userName,
            candidate,
          },
          error: null,
        });

        console.info(`[Signaling] '${ws.userName}'sending a candidate to '${wsClient.userName}'`);
      }
    }
  }

  onClientMessage(wsClients, ws, data) {
    const { message } = data.payload;

    // Broadcast message to all clients in the same room.
    for (let wsClient of wsClients) {
      if (wsClient.roomName === ws.roomName) {
        this.send(wsClient, {
          type: 'message',
          payload: {
            userName: ws.userName,
            message,
          },
          error: null,
        });
      }
    }
  }

  onClientLeave(wsClients, ws) {
    console.info(`[User] '${ws.userName}' left room '${ws.roomName}'.`);

    // Broadcast 'peer left' event to all clients in the same room.
    for (let wsClient of wsClients) {
      if (wsClient.roomName === ws.roomName && wsClient.uid !== ws.uid) {
        this.send(wsClient, {
          type: 'peer left',
          payload: {
            uid: ws.uid,
            userName: ws.userName,
          },
          error: null,
        });
      }
    }
  }
}

module.exports = Hangout;
