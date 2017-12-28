function addMessage(uid, message, timestamp) {
  return {
    type: 'ADD_MESSAGE',
    payload: {
      uid,
      message,
      timestamp: new Date(timestamp),
    },
  };
}

function setClient({ uid, userName, peerConn, stream }) {
  if (stream) {
    stream = URL.createObjectURL(stream);
  }

  return {
    type: 'SET_CLIENT',
    payload: {
      uid,
      userName,
      peerConn,
      stream,
    },
  };
}

function deleteClient(uid) {
  return {
    type: 'DELETE_CLIENT',
    payload: {
      uid,
    },
  };
}


function setUser({ uid, userName, roomName }) {
  return {
    type: 'SET_USER',
    payload: {
      user: {
        uid,
        userName,
        roomName,
      },
    },
  };
}

function setChatRoomReady(chatRoomReady) {
  return {
    type: 'SET_CHATROOM_READY',
    payload: {
      chatRoomReady,
    },
  };
}

function toggleUserAudio(uid) {
  return {
    type: 'TOGGLE_USER_AUDIO',
    payload: {
      uid,
    },
  };
}

export default {
  addMessage,
  setClient,
  deleteClient,
  setUser,
  setChatRoomReady,
  toggleUserAudio,
};
