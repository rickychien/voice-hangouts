class Connector {
  constructor(url, actions) {
    this.ws = new WebSocket(url);
    this.actions = actions;
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

  handleJoined({ uuid }) {
    this.actions.updateClient(uuid);

    // Starting a WebRTC peer connection after joining room successfully

    this.rtcPeerConn = new RTCPeerConnection({
      // Using Google public stun server
      iceServers: [{ url: 'stun:stun2.1.google.com:19302' }],
    }, {
      optional: [{ RtpDataChannels: true }],
    });

    this.rtcPeerConn.addEventListener('icecandidate', (evt) => {
      if (evt.candidate) {
        this.send({
          type: 'candidate',
          payload: {
            candidate: evt.candidate,
          },
        });
      }
    });

    this.rtcPeerConn.addEventListener('error', (err) => {
      console.info(err);
    });

    // when we receive a message from the other peer, display it on the screen
    this.rtcPeerConn.addEventListener('message', (evt) => {
      console.info(evt.data);
    });

    this.rtcPeerConn.addEventListener('close', () => {
      console.info('data channel is closed');
    });

    // Creating data channel
    this.dataChannel = this.rtcPeerConn.createDataChannel('channel1', { reliable: true });
  }

  handleOffer({ uuid, offer }) {
    console.info('Received offer: ', offer);
    this.rtcPeerConn.setRemoteDescription(new RTCSessionDescription(offer));

    // Create an answer to an offer
    this.rtcPeerConn.createAnswer().then((answer) => {
      this.rtcPeerConn.setLocalDescription(answer);
      this.send({
        type: 'answer',
        payload: {
          uuid,
          answer,
        },
      });
      console.info('Sent answer: ', answer);
    }).catch(() => {
      console.info('Error when creating an answer');
    });
  }

  handleAnswer({ answer }) {
    console.info('Received answer: ', answer);
    this.rtcPeerConn.setRemoteDescription(new RTCSessionDescription(answer));
  }

  handleCandidate({ candidate }) {
    console.info('Received candidate: ', candidate);
    this.rtcPeerConn.addIceCandidate(new RTCIceCandidate(candidate));
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
    if (this.rtcPeerConn) {
      this.rtcPeerConn.close();
      this.rtcPeerConn.onicecandidate = null;
    }

    this.actions.updateClient(undefined);
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

  makeCall() {
    this.rtcPeerConn.createOffer().then((offer) => {
      this.send({
        type: 'offer',
        payload: {
          offer,
        },
      });
      console.info('Sent offer: ', offer);
      this.rtcPeerConn.setLocalDescription(offer);
    }).catch(() => {
      console.info('Error when creating an offer');
    });
  }
}

export default Connector;
