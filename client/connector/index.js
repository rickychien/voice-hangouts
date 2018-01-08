import { log } from '../utils'

class Connector {
  constructor (url, actions, store) {
    this.url = url
    this.actions = actions
    this.store = store
  }

  connect () {
    this.ws = new WebSocket(this.url)

    this.ws.addEventListener('open', () => {
      log('Signaling server connection success')
      this.actions.setChatRoomReady(true)
    })

    this.ws.addEventListener('close', () => {
      log('Websocket is closed, reconnecting...')
      this.connect()
      this.joinRoom()
    })

    this.ws.addEventListener('error', () => {
      log('Signaling server connection fail')
    })

    this.ws.addEventListener('message', ({ data }) => {
      const { type, payload } = JSON.parse(data)

      switch (type) {
        case 'joined': {
          this.handleJoined(payload)
          break
        }
        case 'peer joined': {
          this.handlePeerJoined(payload)
          break
        }
        case 'peer left': {
          this.handlePeerLeft(payload)
          break
        }
        case 'offer': {
          this.handleOffer(payload)
          break
        }
        case 'answer': {
          this.handleAnswer(payload)
          break
        }
        case 'candidate': {
          this.handleCandidate(payload)
          break
        }
        case 'update': {
          this.handleUpdate(payload)
          break
        }
        case 'message': {
          this.handleMessage(payload)
          break
        }
        default: {
          break
        }
      }
    })

    return this.ws
  }

  send (data) {
    if (this.ws.readyState === this.ws.OPEN) {
      this.ws.send(JSON.stringify(data))
    } else {
      this.ws.addEventListener('open', function sendData () {
        this.ws.send(JSON.stringify(data))
        this.ws.removeEventListener('open', sendData)
      }.bind(this))
    }
  }

  getUser () {
    return this.store.getState().user
  }

  getClient (id) {
    return this.store.getState().clients.get(id)
  }

  getPeerConnection (peerId, userName) {
    const peerConn = new RTCPeerConnection({
      iceServers: [{
        urls: [
          'stun:stun.l.google.com:19302'
        ]
      }]
    })

    peerConn.addEventListener('icecandidate', ({ candidate }) => {
      if (candidate) {
        this.send({
          type: 'candidate',
          payload: {
            peerId,
            candidate
          }
        })

        log(`Sent ICE candidate to ${userName} (${peerId})`)
      }
    })

    peerConn.addEventListener('track', ({ streams }) => {
      log(`Received remote stream from '${userName}' (${peerId})`)

      // Update peer's stream when receiving remote stream
      this.actions.setClient({ uid: peerId, stream: streams[0] })
    })

    peerConn.addEventListener('error', () => {
      log('Error when creating RTCPeerConnection')
    })

    // Add peer before remote stream arrival
    this.actions.setClient({ uid: peerId, userName, peerConn })

    return peerConn
  }

  getUserMedia () {
    if (this.stream) {
      return this.stream
    }

    // Create self-view stream if it doesn't exist
    this.stream = navigator.mediaDevices.getUserMedia({ audio: true })

    return this.stream
  }

  handleJoined ({ uid, userName, roomName }) {
    log(`User '${userName}' (${uid}) has joined room '${roomName}'`)

    this.actions.setUser({ uid, userName, roomName })
  }

  async handlePeerJoined ({ peerId, userName, roomName }) {
    // If peer connection has established, we skip the negotiation process
    if (this.getClient(peerId)) {
      return
    }

    log(`New peer '${userName}' (${peerId}) joined room '${roomName}'`)

    const peerConn = this.getPeerConnection(peerId, userName)

    peerConn.addEventListener('negotiationneeded', async () => {
      const offer = await peerConn.createOffer()

      await peerConn.setLocalDescription(offer)

      this.send({
        type: 'offer',
        payload: {
          peerId,
          offer
        }
      })

      log(`Sent offer to '${userName}' (${peerId})`)
    })

    const stream = await this.getUserMedia()
    this.actions.setUser({ stream })

    stream.getTracks().forEach((track) => peerConn.addTrack(track, stream))

    log(`Sent local stream to remote user '${userName}' (${peerId})`)
  }

  async handleOffer ({ peerId, userName, offer }) {
    log(`Received offer from '${userName}' (${peerId})`)

    const peerConn = this.getPeerConnection(peerId, userName)

    await peerConn.setRemoteDescription(new RTCSessionDescription(offer))

    const stream = await this.getUserMedia()
    this.actions.setUser({ stream })

    stream.getTracks().forEach((track) => peerConn.addTrack(track, stream))

    log(`Sent local stream to remote user '${userName}' (${peerId})`)

    const answer = await peerConn.createAnswer()

    await peerConn.setLocalDescription(answer)

    this.send({
      type: 'answer',
      payload: {
        peerId,
        answer
      }
    })

    log(`Sent answer to '${userName}' (${peerId})`)
  }

  async handleAnswer ({ peerId, userName, answer }) {
    log(`Received answer from '${userName}' (${peerId})`)

    await this.getClient(peerId).peerConn.setRemoteDescription(new RTCSessionDescription(answer))
  }

  async handleCandidate ({ peerId, userName, candidate }) {
    log(`Received ICE candidate from '${userName}' (${peerId})`)

    await this.getClient(peerId).peerConn.addIceCandidate(new RTCIceCandidate(candidate))
  }

  handleMessage ({ peerId, message, timestamp }) {
    this.actions.addMessage(peerId, message, timestamp)
  }

  handleUpdate ({ user: { uid, userName } }) {
    this.actions.setClient({ uid, userName })
  }

  handlePeerLeft ({ peerId, userName }) {
    log(`Peer '${userName}' (${peerId}) has left`)

    this.actions.deleteClient(peerId)
  }

  joinRoom () {
    const { uid, userName, roomName } = this.getUser() || {}

    this.send({
      type: 'join',
      payload: {
        uid,
        userName,
        roomName
      }
    })
  }

  leaveRoom () {
    const { user: { uid, userName, roomName } } = this.store.getState()

    this.send({
      type: 'leave',
      payload: {
        uid
      }
    })

    if (roomName) {
      // Store user data in localStorage for next time visit
      window.localStorage.setItem(roomName, JSON.stringify({
        uid,
        userName,
        roomName
      }))
    }

    this.actions.setUser({})

    this.store.getState().clients.forEach((client) => {
      if (client.peerConn) {
        client.peerConn.close()
      }
    })
  }

  sendMessage (message) {
    this.send({
      type: 'message',
      payload: {
        message
      }
    })
  }

  sendUpdate (user) {
    this.send({
      type: 'update',
      payload: {
        user
      }
    })
  }

  toggleMediaStream (uid) {
    const user = this.getUser()
    const { stream } = uid === user.uid ? user : this.getClient(uid)
    stream.getAudioTracks()[0].enabled = !stream.getAudioTracks()[0].enabled
  }
}

export default Connector
