export function addMessage(userName, message) {
  return {
    type: 'ADD_MESSAGE',
    payload: {
      userName,
      message,
    },
  };
}

export function setClient({ uid, userName, peerConn, stream }) {
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


export function setUser(uid) {
  return {
    type: 'SET_USER',
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
};
