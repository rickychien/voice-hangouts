import PropTypes from 'prop-types';
import React from 'react';
import { connect } from 'react-redux';

import styles from './App.css';

class App extends React.PureComponent {
  static defaultProps = {
    uuid: undefined,
    messages: [],
  };

  static propTypes = {
    connector: PropTypes.object.isRequired,
    uuid: PropTypes.string,
    messages: PropTypes.array,
  };

  state = {
    roomName: 'test',
    userName: 'bob',
    message: '',
  };

  componentDidMount() {
    this.props.connector.connect();

    window.addEventListener('beforeunload', this.onLeaveRoom);
  }

  componentWillUnmount() {
    window.removeEventListener(this.onLeaveRoom);
  }

  onJoinRoom = () => {
    const { roomName, userName } = this.state;
    this.props.connector.joinRoom(roomName, userName);
  }

  onLeaveRoom = () => {
    this.props.connector.leaveRoom(this.props.uuid);
  }

  onInputChange = (evt) => {
    const { target: { name, value } } = evt;
    this.setState({ [name]: value });
  }

  onCall = () => {
    this.props.connector.makeCall(this.props.uuid);
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
    const { uuid, messages } = this.props;
    const { message, roomName, userName } = this.state;

    return (
      <div className="app">
        <h1 className={ styles.appTitle }>Hangout</h1>
        {
          !uuid ?
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
              <input
                className={ styles.chatInput }
                type="submit"
                value="Call"
                onClick={ this.onCall }
              />
            </div>
        }
      </div>
    );
  }
}

export default connect(
  (state) => ({
    uuid: state.uuid,
    messages: state.messages,
  }),
)(App);
