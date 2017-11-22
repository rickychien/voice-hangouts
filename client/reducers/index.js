const initialState = {
  uuid: undefined,
  messages: [],
};

let mid = 0;

export default function (state = initialState, { type, payload }) {
  switch (type) {
    case 'UPDATE_CLIENT':
      return { ...state, ...{ uuid: payload.uuid } };
    case 'ADD_MESSAGE':
      const { uuid, userName, message } = payload;
      mid += 1;
      return {
        ...state,
        messages: [...state.messages, {
          mid,
          uuid,
          userName,
          message,
        }],
      };
    default:
      return state;
  }
}
