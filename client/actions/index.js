function addMessage (uid, message, timestamp) {
  return {
    type: 'ADD_MESSAGE',
    payload: {
      uid,
      message,
      timestamp: new Date(timestamp)
    }
  }
}

function setClient ({ uid, userName, peerConn, stream }) {
  return {
    type: 'SET_CLIENT',
    payload: {
      uid,
      userName,
      peerConn,
      stream,
      streamUrl: stream ? URL.createObjectURL(stream) : undefined
    }
  }
}

function deleteClient (uid) {
  return {
    type: 'DELETE_CLIENT',
    payload: {
      uid
    }
  }
}

function setUser ({ uid, userName, roomName, stream }) {
  return {
    type: 'SET_USER',
    payload: {
      user: {
        uid,
        userName,
        roomName,
        stream
      }
    }
  }
}

function setChatRoomReady (chatRoomReady) {
  return {
    type: 'SET_CHATROOM_READY',
    payload: {
      chatRoomReady
    }
  }
}

function toggleUserAudio (uid) {
  return {
    type: 'TOGGLE_USER_AUDIO',
    payload: {
      uid
    }
  }
}

export default {
  addMessage,
  setClient,
  deleteClient,
  setUser,
  setChatRoomReady,
  toggleUserAudio
}
