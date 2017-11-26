export function addMessage(userName, message) {
  return {
    type: 'ADD_MESSAGE',
    payload: {
      userName,
      message,
    },
  };
}

export function addPeer(uuid, userName, peerConn, stream) {
  return {
    type: 'ADD_PEER',
    payload: {
      uuid,
      userName,
      peerConn,
      stream,
    },
  };
}

export function addPeerStream(uuid, stream) {
  return {
    type: 'ADD_PEER_STREAM',
    payload: {
      uuid,
      stream,
    },
  };
}

export function setUser(uuid) {
  return {
    type: 'SET_USER',
    payload: {
      uuid,
    },
  };
}

export default {
  addMessage,
  addPeer,
  addPeerStream,
  setUser,
};
