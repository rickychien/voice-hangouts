import { log, to } from '../utils';

class Connector {
  constructor(url, actions, store) {
    this.url = url;
    this.actions = actions;
    this.store = store;
  }

  connect(roomName, userName) {
    let ws = this.ws = new WebSocket(this.url);

    ws.addEventListener('open', () => {
      log('Signaling server connection success');
      this.joinRoom(roomName, userName);
    });

    ws.addEventListener('close', () => {
      log("Websocket is closed, reconnecting...");
      this.connect(roomName, userName);
    });

    ws.addEventListener('error', () => {
      log('Signaling server connection fail');
    });

    ws.addEventListener('message', ({ data }) => {
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

    return ws;
  }

  send(data) {
    this.ws.send(JSON.stringify(data));
  }

  getUser() {
    return this.store.getState().user;
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

        log(`Sent ICE candidate to ${userName} (${peerId})`);
      }
    });

    peerConn.addEventListener('track', ({ streams }) => {
      log(`Received remote stream from '${userName}' (${peerId})`);

      // Update peer's stream when receiving remote stream
      this.actions.setClient({ uid: peerId, stream: streams[0] });
    });

    peerConn.addEventListener('error', (error) => {
      log('Error when creating RTCPeerConnection');
    });

    // Add peer before remote stream arrival
    this.actions.setClient({ uid: peerId, userName, peerConn });

    return peerConn;
  }

  getUserMedia(fake) {
    if (this.stream) {
      return this.stream;
    }

    // Create self-view stream if it doesn't exist
    this.stream = navigator.mediaDevices.getUserMedia({ audio: true });

    return this.stream;
  }

  async handleJoined({ uid, userName, roomName }) {
    log(`User '${userName}' (${uid}) has joined room '${roomName}'`);

    this.actions.setUser({ uid, userName, roomName });
  }

  async handlePeerJoined({ peerId, userName, roomName }) {
    log(`New peer '${userName}' (${peerId}) joined room '${roomName}'`);

    const peerConn = this.getPeerConnection(peerId, userName);

    peerConn.addEventListener('negotiationneeded', async () => {
      let err, offer;

      [err, offer] = await to(peerConn.createOffer());
      if (err) throw err;

      [err] = await to(peerConn.setLocalDescription(offer));
      if (err) throw err;

      this.send({
        type: 'offer',
        payload: {
          peerId,
          offer,
        },
      });

      log(`Sent offer to '${userName}' (${peerId})`);
    });

    const [err, stream] = await to(this.getUserMedia());
    if (err) throw err;

    stream.getTracks().forEach((track) => peerConn.addTrack(track, stream));

    log(`Sent local stream to remote user '${userName}' (${peerId})`);
  }

  async handleOffer({ peerId, userName, offer }) {
    log(`Received offer from '${userName}' (${peerId})`);

    let err, answer, stream;
    const peerConn = this.getPeerConnection(peerId, userName);

    [err] = await to(peerConn.setRemoteDescription(new RTCSessionDescription(offer)));
    if (err) throw err;

    [err, stream] = await to(this.getUserMedia());
    if (err) throw err;

    stream.getTracks().forEach((track) => peerConn.addTrack(track, stream));

    log(`Sent local stream to remote user '${userName}' (${peerId})`);

    [err, answer] = await to(peerConn.createAnswer());
    if (err) throw err;

    [err] = await to(peerConn.setLocalDescription(answer));
    if (err) throw err;

    this.send({
      type: 'answer',
      payload: {
        peerId,
        answer,
      },
    });

    log(`Sent answer to '${userName}' (${peerId})`);
  }

  async handleAnswer({ peerId, userName, answer }) {
    log(`Received answer from '${userName}' (${peerId})`);

    const { peerConn } = this.getClient(peerId);
    const [err] = await to(peerConn.setRemoteDescription(new RTCSessionDescription(answer)));
    if (err) throw err;
  }

  async handleCandidate({ peerId, userName, candidate }) {
    log(`Received ICE candidate from '${userName}' (${peerId})`);

    const { peerConn } = this.getClient(peerId);
    const [err] = await to(peerConn.addIceCandidate(new RTCIceCandidate(candidate)));
    if (err) throw err;
  }

  handleMessage({ userName, message }) {
    this.actions.addMessage(userName, message);
  }

  handlePeerLeft({ peerId, userName }) {
    log(`Peer '${userName}' (${peerId}) has left`);

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
        uid: this.store.getState().user.uid,
      },
    });

    this.actions.setUser({});

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
