let socket = new WebSocket('ws:/localhost:3000/message');

window.addEventListener('load', () => {
  let chatroom = document.getElementById('chatroom');
  let input = document.getElementById('inputbox');

  input.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
      socket.send(JSON.stringify({
        type: 'message',
        room: 'test',
        name: 'bob',
        value: input.value,
      }));
      input.value = "";
    }
  });

  socket.onopen = function (e) {
    socket.send(JSON.stringify({
      type: 'join',
      name: 'bob',
      room: 'test',
    }));
  }

  socket.onmessage = function (e) {
    let { value } = JSON.parse(e.data);
    let msg = document.createElement('div');
    msg.innerHTML = value;
    chatroom.appendChild(msg);
  }

  socket.onerror = function (e) {
    console.log('error');
  }

});

window.addEventListener('beforeunload', () => {
  socket.send(JSON.stringify({
    type: 'leave',
    name: 'bob',
    room: 'test',
  }));
});
