export function updateClient(uuid) {
  return {
    type: 'UPDATE_CLIENT',
    payload: {
      uuid,
    },
  };
}

export function addMessage(uuid, userName, message) {
  return {
    type: 'ADD_MESSAGE',
    payload: {
      uuid,
      userName,
      message,
    },
  };
}

export default {
  updateClient,
  addMessage,
};
