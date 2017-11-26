import PropTypes from 'prop-types';
import React from 'react';
import { connect } from 'react-redux';

import styles from './App.css';

class App extends React.PureComponent {
  static propTypes = {
    connector: PropTypes.object.isRequired,
    clients: PropTypes.object.isRequired,
    messages: PropTypes.array.isRequired,
    uid: PropTypes.string.isRequired,
  };

  state = {
    roomName: 'test',
    userName: 'bob',
    message: '',
  };

  componentDidMount() {
    window.addEventListener('beforeunload', this.onLeaveRoom);
  }

  componentWillUnmount() {
    window.removeEventListener(this.onLeaveRoom);
  }

  onJoinRoom = () => {
    const { roomName, userName } = this.state;
    this.props.connector.connect();
    this.props.connector.joinRoom(roomName, userName);
  }

  onLeaveRoom = () => {
    this.props.connector.leaveRoom(this.props.uid);
  }

  onInputChange = (evt) => {
    const { target: { name, value } } = evt;
    this.setState({ [name]: value });
  }

  onSendMessage = (evt) => {
    const { key } = evt;
    const { message } = this.state;

    if (key === 'Enter' && message) {
      this.props.connector.sendMessage(message);
      this.setState({ message: '' });
    }
  }

  render() {
    const { uid, messages, clients } = this.props;
    const { message, roomName, userName } = this.state;

    return (
      <div className="app">
        <h1 className={ styles.appTitle }>Hangout</h1>
        {
          !uid ?
            <div className={ styles.app }>
              <h2 className={ styles.roomTitle }>Start a chatroom</h2>
              <input
                className={ styles.chatInput }
                name="roomName"
                placeholder="Room name"
                value={ roomName }
                onChange={ this.onInputChange }
              />
              <input
                className={ styles.chatInput }
                name="userName"
                placeholder="User name"
                value={ userName }
                onChange={ this.onInputChange }
              />
              <input
                className={ styles.chatInput }
                type="submit"
                value="Join a room"
                onClick={ this.onJoinRoom }
              />
            </div>
         :
            <div className={ styles.app }>
              <div className={ styles.roomTitle }>Room <strong>{ roomName }</strong></div>
              <div className={ styles.messages }>
                {
                  messages.map((msg) =>
                    (
                      <div key={ msg.mid }>
                        { `${msg.userName}: ${msg.message}` }
                      </div>
                    ),
                  )
                }
              </div>
              <input
                className={ styles.messageInput }
                name="message"
                placeholder="type message here..."
                value={ message }
                onChange={ this.onInputChange }
                onKeyPress={ this.onSendMessage }
              />
              {
                Array.from(clients).filter(([, peer]) => peer.stream).map(([id, peer]) => (
                  <video
                    key={ id }
                    autoPlay
                    className={ styles.video }
                    src={ URL.createObjectURL(peer.stream) }
                  />
                ))
              }
            </div>
        }
      </div>
    );
  }
}

export default connect(
  (state) => ({
    clients: state.clients,
    messages: state.messages,
    uid: state.uid,
  }),
)(App);
