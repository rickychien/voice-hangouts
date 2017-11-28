import to from '../utils/to';

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
      const { type, payload } = JSON.parse(data);

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

  getPeerConnection(peerId, userName) {
    const peerConn = new RTCPeerConnection({
      iceServers: [{
        urls: [
          "stun:stun.l.google.com:19302",
        ]
      }
    ]});

    peerConn.addEventListener('icecandidate', ({ candidate }) => {
      if (candidate) {
        this.send({
          type: 'candidate',
          payload: {
            peerId,
            candidate,
          },
        });

        console.info(`Sent candidate to ${userName} (${peerId})`);
      }
    });

    peerConn.addEventListener('track', ({ streams }) => {
      // Update peer's stream
      this.actions.setClient({ uid: peerId, stream: streams[0] });

      console.info(`Received remote stream from ${userName} (${peerId})`);
    });

    peerConn.addEventListener('error', (error) => {
      console.info(error);
    });

    console.info(`Sent local stream to ${userName} (${peerId})`);

    // Store peer before peer's stream arrival
    this.actions.setClient({ uid: peerId, userName, peerConn });

    return peerConn;
  }

  getSelfViewStream(fake) {
    if (this.stream) {
      return this.stream;
    }

    // Create self-view stream if it doesn't exist
    this.stream = navigator.mediaDevices.getUserMedia({
      video: true,
      fake,
    });

    return this.stream;
  }

  async handleJoined({ uid, userName }) {
    this.actions.setUser(uid);
    // Start sending client's self-view stream to peer
    const stream = await this.getSelfViewStream(userName === 'bob');
    this.actions.setClient({ uid, userName, stream });
    console.info('Set self stream on screen');
  }

  async handlePeerJoined({ peerId, userName }) {
    const peerConn = this.getPeerConnection(peerId, userName);

    peerConn.addEventListener('negotiationneeded', async () => {
      let err, offer;

      [err, offer] = await to(peerConn.createOffer());
      if (err) console.error(err);

      [err] = await to(peerConn.setLocalDescription(offer));
      if (err) console.error(err);

      this.send({
        type: 'offer',
        payload: {
          peerId,
          offer,
        },
      });

      console.info(`Sent offer to ${userName} (${peerId})`);
    });

    const [err, stream] = await to(this.getSelfViewStream(userName === 'bob'));
    if (err) console.error(err);

    stream.getTracks().forEach((track) => peerConn.addTrack(track, stream));

    console.info(`New peer ${userName} (${peerId}) joined`);
  }

  async handleOffer({ peerId, userName, offer }) {
    let err, answer, stream;
    const peerConn = this.getPeerConnection(peerId, userName);

    [err] = await to(peerConn.setRemoteDescription(new RTCSessionDescription(offer)));
    if (err) console.error(err);

    [err, stream] = await to(this.getSelfViewStream(userName === 'bob'));
    if (err) console.error(err);

    stream.getTracks().forEach((track) => peerConn.addTrack(track, stream));

    console.info(`Received offer from ${userName} (${peerId})`);

    [err, answer] = await to(peerConn.createAnswer());
    if (err) console.error(err);

    [err] = await to(peerConn.setLocalDescription(answer));
    if (err) console.error(err);

    this.send({
      type: 'answer',
      payload: {
        peerId,
        answer,
      },
    });

    console.info(`Sent answer to ${userName} (${peerId})`);
  }

  async handleAnswer({ peerId, userName, answer }) {
    const { peerConn } = this.getClient(peerId);
    const [err] = await to(peerConn.setRemoteDescription(new RTCSessionDescription(answer)));
    if (err) console.error(err);

    console.info(`Received answer from ${userName} (${peerId})`);
  }

  async handleCandidate({ peerId, userName, candidate }) {
    const { peerConn } = this.getClient(peerId);
    const [err] = await to(peerConn.addIceCandidate(new RTCIceCandidate(candidate)));
    if (err) console.error(err);

    console.info(`Received candidate from ${userName} (${peerId})`);
  }

  handleMessage({ userName, message }) {
    this.actions.addMessage(userName, message);
  }

  handlePeerLeft({ peerId, userName }) {
    console.log(`Peer ${userName} (${peerId}) has left`);
    this.actions.deleteClient(peerId);
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
