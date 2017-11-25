export function updateClient(uuid) {
  return {
    type: 'UPDATE_CLIENT',
    payload: {
      uuid,
    },
  };
}

export function addMessage(userName, message) {
  return {
    type: 'ADD_MESSAGE',
    payload: {
      userName,
      message,
    },
  };
}

export default {
  updateClient,
  addMessage,
};
