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

  getPeer(id) {
    return this.store.getState().peers.get(id);
  }

  handleJoined({ uuid }) {
    this.actions.setUser(uuid);
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
      this.actions.addPeerStream(calleeId, stream);
    });

    peerConn.addEventListener('error', (err) => {
      console.info(err);
    });

    const stream = await navigator.mediaDevices.getUserMedia({
      audio: true,
      video: true,
    });

    this.actions.addPeer(calleeId, userName, peerConn, stream);
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
      this.actions.addPeerStream(callerId, stream);
    });

    peerConn.addEventListener('error', (err) => {
      console.info(err);
    });

    peerConn.setRemoteDescription(new RTCSessionDescription(offer));

    // Create an answer to an offer
    const answer = await peerConn.createAnswer();

    peerConn.setLocalDescription(answer);

    this.actions.addPeer(callerId, userName, peerConn);

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
    this.getPeer(calleeId).peerConn.setRemoteDescription(new RTCSessionDescription(answer));
  }

  handleCandidate({ peerId, candidate }) {
    console.info(`Received candidate from ${peerId}`);
    const peer = this.getPeer(peerId);
    if (peer) {
      this.getPeer(peerId).peerConn.addIceCandidate(new RTCIceCandidate(candidate));
    }
  }

  handleMessage({ userName, message }) {
    this.actions.addMessage(userName, message);
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
