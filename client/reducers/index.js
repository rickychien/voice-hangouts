const initialState = {
  uuid: undefined,
  messages: [],
  peers: new Map(),
};

let mid = 0;

export default function (state = initialState, { type, payload }) {
  switch (type) {
    case 'SET_USER': {
      return { ...state, ...{ uuid: payload.uuid } };
    }
    case 'ADD_MESSAGE': {
      const { userName, message } = payload;
      mid += 1;
      return {
        ...state,
        messages: [...state.messages, {
          mid,
          userName,
          message,
        }],
      };
    }
    case 'ADD_PEER': {
      return { ...state, ...{ peers: new Map(state.peers.set(payload.uuid, payload)) } };
    }
    case 'ADD_PEER_STREAM': {
      const peer = {
        ...state.peers.get(payload.uuid),
        stream: payload.stream,
      };
      return { ...state, ...{ peers: new Map(state.peers.set(payload.uuid, peer)) } };
    }
    default: {
      return state;
    }
  }
}
