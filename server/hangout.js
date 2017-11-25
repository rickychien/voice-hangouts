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
        // this.onClientCandidate(wsClients, ws, data);
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
      // Generate unique id for the new client
      const uuid = uuidv4();

      // Store the client
      ws.uuid = uuid;
      ws.userName = userName;
      ws.roomName = roomName;

      // Send vaild uuid back to client
      this.send(ws, {
        type: 'joined',
        payload: {
          uuid,
        },
        error: null,
      });

      console.info(`[User] '${userName}' joined room '${roomName}'.`);
    }
  }

  onClientOffer(wsClients, ws, data) {
    const { offer } = data.payload;

    // Broadcast offer to other clients in the same room.
    for (let wsClient of wsClients) {
      if (wsClient.roomName === ws.roomName && wsClient.uuid !== ws.uuid) {
        console.info(`[Singaling] ${ws.userName} sending offer to: ${wsClient.userName}`);
        this.send(wsClient, {
          type: 'offer',
          payload: {
            uuid: ws.uuid,
            offer,
          },
          error: null,
        });
      }
    }
  }

  onClientAnswer(wsClients, ws, data) {
    const { answer, uuid } = data.payload;

    // Send answer to the target client
    for (let wsClient of wsClients) {
      if (wsClient.uuid === uuid) {
        console.info(`[Singaling] ${ws.userName} sending answer to: ${wsClient.userName}`);
        this.send(wsClient, {
          type: 'answer',
          payload: {
            answer,
          },
          error: null,
        });
      }
    }
  }

  onClientCandidate(wsClients, ws, data) {
    const { candidate } = data.payload;

    // Broadcast candidate to the target client
    for (let wsClient of wsClients) {
      if (wsClient.uuid === uuid) {
        console.info(`[Singaling] ${ws.userName} sending candidate to: ${wsClient.userName}`);
        this.send(wsClient, {
          type: 'candidate',
          payload: {
            candidate,
          },
          error: null,
        });
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
  }
}

module.exports = Hangout;
