class Connector {
  constructor(url, actions) {
    this.ws = new WebSocket(url);
    this.actions = actions;

    this.ws.addEventListener('open', () => {
      console.info('Websocket connected');
    });

    this.ws.addEventListener('message', ({ data }) => {
      const { type, error, payload } = JSON.parse(data);

      if (error) {
        throw error;
      }

      switch (type) {
        case 'joined':
          actions.updateClient(payload.uuid);
          break;
        case 'message':
          actions.addMessage(payload.uuid, payload.userName, payload.message);
          break;
        case 'left':
          actions.updateClient(undefined);
          break;
        default:
          break;
      }
    });

    this.ws.addEventListener('error', () => {
      console.info('Websocket connection error');
    });
  }

  send(data) {
    this.ws.send(JSON.stringify(data));
  }

  joinRoom(roomName, userName) {
    // Notify server a join event
    this.send({
      type: 'join',
      payload: {
        roomName,
        userName,
      },
    });
  }

  sendMessage(uuid, message) {
    // Notify server a message event
    this.send({
      type: 'message',
      payload: {
        uuid,
        message,
      },
    });
  }

  leaveRoom(uuid) {
    // Notify server a leave event
    this.send({
      type: 'leave',
      payload: {
        uuid,
      },
    });
  }
}

export default Connector;
