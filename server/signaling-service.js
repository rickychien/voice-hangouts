const uuidv4 = require('uuid/v4')

class SignalingService {
  constructor (wsClients) {
    this.wsClients = wsClients
  }

  send (ws, data) {
    ws.send(JSON.stringify(data))
  }

  sendToPeer (type, ws, payload) {
    const { peerId } = payload

    this.wsClients.forEach((wsClient) => {
      if (wsClient.uid === peerId) {
        this.send(wsClient, {
          type,
          payload: {
            peerId: ws.uid,
            userName: ws.userName,
            [type]: payload[type]
          }
        })
      }

      console.info(`[Send] '${ws.uid}' sent '${type}' to user '${peerId}'`)
    })
  }

  broadcastToRoomPeers (type, ws, payload, includeSelf) {
    this.wsClients.forEach((wsClient) => {
      if (wsClient.roomName === ws.roomName && (includeSelf || wsClient.uid !== ws.uid)) {
        this.send(wsClient, {
          type,
          payload: {
            peerId: ws.uid,
            userName: ws.userName,
            roomName: ws.roomName,
            timestamp: new Date(),
            ...payload
          }
        })
      }
    })

    console.info(`[Broadcast] '${ws.uid}' broadcasted '${type}' to all peers in room '${ws.roomName}'.`)
  }

  onMessage (ws, message) {
    const { type, payload } = JSON.parse(message)
    this[`onClient${type[0].toUpperCase() + type.slice(1)}`](ws, payload)
  }

  onClientJoin (ws, payload) {
    const { uid, userName, roomName } = payload

    // Store the client
    ws.uid = uid || uuidv4()
    ws.userName = userName
    ws.roomName = roomName

    // Send vaild uid back to client
    this.send(ws, {
      type: 'joined',
      payload: {
        uid: ws.uid,
        userName: ws.userName,
        roomName: ws.roomName
      }
    })

    this.broadcastToRoomPeers('peer joined', ws)
  }

  onClientOffer (ws, payload) {
    this.sendToPeer('offer', ws, payload)
  }

  onClientAnswer (ws, payload) {
    this.sendToPeer('answer', ws, payload)
  }

  onClientCandidate (ws, payload) {
    this.sendToPeer('candidate', ws, payload)
  }

  onClientMessage (ws, payload) {
    this.broadcastToRoomPeers('message', ws, payload, true)
  }

  onClientUpdate (ws, payload) {
    this.broadcastToRoomPeers('update', ws, payload, false)
  }

  onClientLeave (ws) {
    this.broadcastToRoomPeers('peer left', ws, {}, false)
  }
}

module.exports = SignalingService
