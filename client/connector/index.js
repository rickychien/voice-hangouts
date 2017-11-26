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

  async handleJoined({ uid, userName }) {
    this.actions.setUser(uid);
    this.actions.setClient({ uid, userName });
  }

  async handlePeerJoined({ calleeId, userName }) {
    const peerConn = new RTCPeerConnection({
      // Using Google public stun server
      iceServers: [{ urls: 'stun:stun2.1.google.com:19302' }],
    }, {
      optional: [{ RtpDataChannels: true }],
    });

    peerConn.addEventListener('icecandidate', ({ candidate }) => {
      if (candidate) {
        this.send({
          type: 'candidate',
          payload: {
            peerId: calleeId,
            candidate,
          },
        });
      }
    });

    peerConn.addEventListener('addstream', ({ stream }) => {
      console.info(`Caller received stream from callee ${calleeId}`);
      // Update peer's stream
      this.actions.setClient({ uid: calleeId, stream });
    });

    peerConn.addEventListener('error', (err) => {
      console.info(err);
    });

    // Create self-view stream
    const stream = await navigator.mediaDevices.getUserMedia({
      audio: true,
      video: true,
    });

    // Update client stream to local client list
    const { uid } = this.store.getState();
    this.actions.setClient({ uid, stream });

    // Update peer before peer's stream arrival
    this.actions.setClient({ uid: calleeId, userName, peerConn });

    // Start sending client's self-view stream to peer
    peerConn.addStream(stream);

    const offer = await peerConn.createOffer();
    peerConn.setLocalDescription(offer);

    this.send({
      type: 'offer',
      payload: {
        calleeId,
        offer,
      },
    });

    console.info(`Sent offer to ${calleeId}`);
  }

  async handleOffer({ callerId, userName, offer }) {
    console.info(`Received offer from ${callerId}`);

    const peerConn = new RTCPeerConnection({
      // Using Google public stun server
      iceServers: [{ urls: 'stun:stun2.1.google.com:19302' }],
    }, {
      optional: [{ RtpDataChannels: true }],
    });

    peerConn.addEventListener('icecandidate', ({ candidate }) => {
      if (candidate) {
        this.send({
          type: 'candidate',
          payload: {
            peerId: callerId,
            candidate,
          },
        });
      }
    });

    peerConn.addEventListener('addstream', ({ stream }) => {
      console.info(`Callee received stream from caller ${callerId}`);
      // Update peer's stream
      this.actions.setClient({ uid: callerId, stream });
    });

    peerConn.addEventListener('error', (err) => {
      console.info(err);
    });

    peerConn.setRemoteDescription(new RTCSessionDescription(offer));

    // Create self-view stream
    const stream = await navigator.mediaDevices.getUserMedia({
      audio: true,
      video: true,
    });

    // Update stream to client itself
    const { uid } = this.store.getState();
    this.actions.setClient({ uid, stream });

    // Update peer before peer's stream arrival
    this.actions.setClient({ uid: callerId, userName, peerConn });

    // Start sending client's self-view stream to peer
    peerConn.addStream(stream);

    // Create an answer to an offer
    const answer = await peerConn.createAnswer();

    peerConn.setLocalDescription(answer);

    this.send({
      type: 'answer',
      payload: {
        callerId,
        answer,
      },
    });

    console.info(`Sent answer to ${callerId}`);
  }

  handleAnswer({ calleeId, answer }) {
    console.info(`Received answer from ${calleeId}`);
    this.getClient(calleeId).peerConn.setRemoteDescription(new RTCSessionDescription(answer));
  }

  handleCandidate({ peerId, candidate }) {
    console.info(`Received candidate from ${peerId}`);
    const client = this.getClient(peerId);
    if (client && client.peerConn) {
      client.peerConn.addIceCandidate(new RTCIceCandidate(candidate));
    }
  }

  handleMessage({ userName, message }) {
    this.actions.addMessage(userName, message);
  }

  handlePeerLeft({ uid }) {
    console.log(`Peer ${uid} has left`);
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

    this.store.getState().peers.forEach((peer) => {
      peer.peerConn.close();
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
