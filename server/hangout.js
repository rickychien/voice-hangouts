const uuidv4 = require('uuid/v4');

class Hangout {
  constructor() {
    this.rooms = new Map();
  }

  send(ws, data) {
    ws.send(JSON.stringify(data));
  }

  onMessage(ws, message) {
    const { type, ...data } = JSON.parse(message);

    switch (type) {
      case 'join': {
        this.onClientJoin(ws, data);
        break;
      }
      case 'message': {
        this.onClientMessage(ws, data);
        break;
      }
      case 'leave': {
        this.onClientLeave(ws, data);
        break;
      }
      default:
        break;
    }
  }

  onClientJoin(ws, data) {
    const { roomName, userName } = data.payload;
    const { rooms } = this;
    const clients = rooms.get(roomName) || new Map();

    // Create a new room if the room doesn't exist.
    if (clients.size === 0) {
      rooms.set(roomName, clients);

      console.info(`[Room] '${roomName}' has created.`);
    }

    if (clients.has(userName)) {
      // Reject client if username has been used.
      this.send(ws, {
        type: 'join',
        payload: {},
        error: `Username ${userName} has been used`,
      });

      console.info(`[Client] '${userName}' has been rejected due to same user existed.`);
    } else {
      // Generate unique id for the new client
      const uuid = uuidv4();

      // Store client in server
      clients.set(uuid, {
        uuid,
        userName,
        roomName,
        ws,
      });

      // Send vaild uuid back to client
      this.send(ws, {
        type: 'joined',
        payload: {
          uuid,
        },
        error: null,
      });

      console.info(`[Client] '${userName}' joined ${roomName}.`);
    }
  }

  onClientMessage(ws, data) {
    const { uuid, message } = data.payload;
    const { rooms } = this;
    let roomClients;

    for (let clients of rooms.values()) {
      if (clients.has(uuid)) {
        roomClients = clients;
        break;
      }
    }

    if (!roomClients) {
      this.send(ws, {
        type: 'message',
        payload: {},
        error: 'invalid room name',
      });
    } else {
      // Broadcast message to all clients in the same room.
      roomClients.forEach((client) => {
        this.send(client.ws, {
          type: 'message',
          payload: {
            uuid,
            userName: roomClients.get(uuid).userName,
            message,
          },
          error: null,
        });
      });
    }
  }

  onClientLeave(ws, data) {
    const { uuid } = data.payload;
    const { rooms } = this;

    rooms.forEach((clients, room) => {
      if (clients.has(uuid)) {
        console.info(`[Client] '${clients.get(uuid).username}' left ${room}.`);
        clients.delete(uuid);

        // Destroy the room if there is no one in the room.
        if (clients.size === 0) {
          rooms.delete(room);

          console.info(`[Room] '${room}' has been destroyed.`);
        }
      }
    });
  }
}

module.exports = Hangout;
