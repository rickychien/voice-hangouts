export function addMessage(uid, message) {
  return {
    type: 'ADD_MESSAGE',
    payload: {
      uid,
      message,
    },
  };
}

export function setClient({ uid, userName, peerConn, stream }) {
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

export function deleteClient(uid) {
  return {
    type: 'DELETE_CLIENT',
    payload: {
      uid,
    },
  };
}


export function setUser({ uid, userName, roomName }) {
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

export function setChatRoomReady(chatRoomReady) {
  return {
    type: 'SET_CHATROOM_READY',
    payload: {
      chatRoomReady,
    },
  };
}

export default {
  addMessage,
  setClient,
  deleteClient,
  setUser,
  setChatRoomReady,
};
