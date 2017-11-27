class Connector {
  constructor(url, actions, store) {
    this.ws = new WebSocket(url);
    this.actions = actions;
    this.store = store;
  }

  connect() {
    this.ws.addEventListener('open', () => {
      console.info('Websocket connected');
    });

    this.ws.addEventListener('message', ({ data }) => {
      const { type, error, payload } = JSON.parse(data);

      if (error) {
        throw error;
      }

      switch (type) {
        case 'joined': {
          this.handleJoined(payload);
          break;
        }
        case 'peer joined': {
          this.handlePeerJoined(payload);
          break;
        }
        case 'peer left': {
          this.handlePeerLeft(payload);
          break;
        }
        case 'offer': {
          this.handleOffer(payload);
          break;
        }
        case 'answer': {
          this.handleAnswer(payload);
          break;
        }
        case 'candidate': {
          this.handleCandidate(payload);
          break;
        }
        case 'message': {
          this.handleMessage(payload);
          break;
        }
        default: {
          break;
        }
      }
    });

    this.ws.addEventListener('error', () => {
      console.info('Websocket connection error');
    });
  }

  send(data) {
    this.ws.send(JSON.stringify(data));
  }

  getClient(id) {
    return this.store.getState().clients.get(id);
  }

  async createPeerConnection(peerId, userName, type) {
    const peerConn = new RTCPeerConnection({
      iceServers: [{ urls: 'stun:stun2.1.google.com:19302' }],
    }, {
      optional: [{ RtpDataChannels: true }],
    });

    peerConn.addEventListener('negotiationneeded', async () => {
      switch (type) {
        case 'offer': {
          const offer = await peerConn.createOffer();
          await peerConn.setLocalDescription(offer);

          this.send({
            type: 'offer',
            payload: {
              peerId,
              offer,
            },
          });

          console.info(`Sent offer to ${userName} (${peerId})`);
          break;
        }
        case 'answer': {
          const answer = await peerConn.createAnswer();
          await peerConn.setLocalDescription(answer);

          this.send({
            type: 'answer',
            payload: {
              peerId,
              answer,
            },
          });

          console.info(`Sent answer to ${userName} (${peerId})`);
          break;
        }
        default: {
          break;
        }
      }
    });

    peerConn.addEventListener('icecandidate', ({ candidate }) => {
      if (candidate) {
        this.send({
          type: 'candidate',
          payload: {
            peerId,
            candidate,
          },
        });

        console.info(`Sent icecandidate to ${userName} (${peerId})`);
      }
    });

    peerConn.addEventListener('addstream', ({ stream }) => {
      // Update peer's stream
      this.actions.setClient({ uid: peerId, stream });

      console.info(`Received remote stream from ${userName} (${peerId})`);
    });

    peerConn.addEventListener('error', (err) => {
      console.info(err);
    });

    // Start sending client's self-view stream to peer
    const stream = await this.createSelfViewStream();
    peerConn.addStream(stream);

    // Update peer before peer's stream arrival
    this.actions.setClient({ uid: peerId, userName, peerConn, stream });

    return peerConn;
  }

  async createSelfViewStream() {
    // Create self-view stream
    const stream = await navigator.mediaDevices.getUserMedia({
      audio: true,
      video: true,
    });

    // Update stream to client itself
    const { uid } = this.store.getState();
    this.actions.setClient({ uid, stream });

    return stream;
  }

  async handleJoined({ uid, userName }) {
    this.actions.setUser(uid);
    this.actions.setClient({ uid, userName });
  }

  async handlePeerJoined({ peerId, userName }) {
    console.info(`New peer ${userName} (${peerId}) joined`);
    await this.createPeerConnection(peerId, userName, 'offer');
  }

  async handleOffer({ peerId, userName, offer }) {
    console.info(`Received offer from ${userName} (${peerId})`);

    const peerConn = await this.createPeerConnection(peerId, userName, 'answer');
    await peerConn.setRemoteDescription(new RTCSessionDescription(offer));
  }

  async handleAnswer({ peerId, userName, answer }) {
    console.info(`Received answer from ${userName} (${peerId})`);

    await this.getClient(peerId).peerConn.setRemoteDescription(new RTCSessionDescription(answer));
  }

  async handleCandidate({ peerId, userName, candidate }) {
    console.info(`Received candidate from ${userName} (${peerId})`);

    const client = this.getClient(peerId);
    if (client && client.peerConn) {
      await client.peerConn.addIceCandidate(new RTCIceCandidate(candidate));
    }
  }

  handleMessage({ userName, message }) {
    this.actions.addMessage(userName, message);
  }

  handlePeerLeft({ uid, userName }) {
    console.log(`Peer ${userName} (${uid}) has left`);
    this.actions.deleteClient(uid);
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

  leaveRoom() {
    this.send({
      type: 'leave',
      payload: {
        uid: this.store.getState().uid,
      },
    });

    this.store.getState().clients.forEach((client) => {
      if (client.peerConn) {
        client.peerConn.close();
      }
    });
  }

  sendMessage(message) {
    // Notify server a message event
    this.send({
      type: 'message',
      payload: {
        message,
      },
    });
  }
}

export default Connector;
