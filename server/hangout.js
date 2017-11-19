class Hangout {
  constructor() {
    this.rooms = new Map();
  }

  onMessage(ws, message) {
    let { type, ...data } = JSON.parse(message);

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
    }
  }

  onClientJoin(ws, { room, name }) {
    let rooms = this.rooms;
    let clients = rooms.get(room) || new Map();

    // Create a new room if the room doesn't exist.
    if (clients.size === 0) {
      rooms.set(room, clients);
      console.info(`[Room] '${room}' has created.`);
    }

    // Reject client if username has existed.
    if (clients.has(name)) {
      ws.send(JSON.stringify({ type: 'rejected' }));
      console.info(`[Client] '${name}' has been rejected due to same user existed.`);
    }
    // Add client
    else {
      clients.set(name, { name, room, ws });

      ws.send(JSON.stringify({
        type: 'text',
        value: `${name} joined ${room}`,
      }));
      console.info(`[Client] '${name}' joined ${room}.`);
    }
  }

  onClientMessage(ws, { room, name, value }) {
    let rooms = this.rooms;
    let clients = rooms.get(room);

    if (!clients) {
      ws.send(JSON.stringify({ type: 'rejected' }));
    }
    // Broadcast message to all clients in the same room.
    else {
      clients.forEach((client) => {
        ws.send(JSON.stringify({ type: 'text', value }));
      });
    }
  }

  onClientLeave(ws, { room, name }) {
    let rooms = this.rooms;
    let clients = rooms.get(room);

    // Remove the client from given room.
    if (clients) {
      clients.delete(name);
      console.info(`[Client] '${name}' left ${room}.`);
    }

    // Destroy the room if there is no one in the room.
    if (clients.size === 0) {
      rooms.delete(room);
      console.info(`[Room] '${room}' has been destroyed.`);
    }
  }
}

module.exports = Hangout;
