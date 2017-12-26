import PropTypes from 'prop-types';
import React from 'react';
import { connect } from 'react-redux';

import Actions from '../../actions';

import styles from './App.css';

const DOMAIN_URL = 'voice-hangouts.herokuapp.com/';

class App extends React.PureComponent {
  static propTypes = {
    connector: PropTypes.object.isRequired,
    clients: PropTypes.object.isRequired,
    messages: PropTypes.array.isRequired,
    user: PropTypes.object.isRequired,
    addMessage: PropTypes.func.isRequired,
  };

  state = {
    roomName: '',
    message: '',
  };

  componentDidMount() {
    window.addEventListener('beforeunload', this.onLeaveRoom);
  }

  componentWillUnmount() {
    window.removeEventListener(this.onLeaveRoom);
  }

  onJoinRoom = () => {
    this.props.connector.connect(this.state.roomName || 'ballroom');
  }

  onLeaveRoom = () => {
    const { user } = this.props;
    if (user.uid) {
      this.props.connector.leaveRoom(user.uid);
    }
  }

  onInputChange = (evt) => {
    const { target: { name, value } } = evt;
    this.setState({ [name]: value });
  }

  onRoomNameKeyPress = (evt) => {
    if (evt.key === 'Enter') {
      this.onJoinRoom();
    }
  }

  onSendMessage = (evt) => {
    const { key } = evt;
    const { message } = this.state;
    const { addMessage, connector, user } = this.props;

    if (key === 'Enter' && message) {
      addMessage(user.userName, message);
      connector.sendMessage(message);
      this.setState({ message: '' });
    }
  }

  render() {
    const { user, messages, clients } = this.props;
    const { message, roomName } = this.state;

    return (
      <div className={ styles.app }>
        <h1 className={ styles.appTitle }>Voice Hangouts</h1>
        <p>Truly lightweight audio-only WebRTC chat</p>
        {
          !user.uid ?
            <div className={ styles.startChatForm }>
              <span className={ styles.createRoomInput }>
                <span className={ styles.domain }>{ DOMAIN_URL }</span>
                <input
                  autoFocus
                  className={ styles.roomNameInput }
                  name="roomName"
                  placeholder="room"
                  value={ roomName }
                  onChange={ this.onInputChange }
                  onKeyPress={ this.onRoomNameKeyPress }
                />
              </span>
              <input
                className={ styles.startChatButton }
                type="submit"
                value="Go"
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
                  <audio
                    key={ id }
                    autoPlay
                    src={ peer.stream }
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
    user: state.user,
  }),
  (dispatch) => ({
    addMessage: (userName, message) => dispatch(Actions.addMessage(userName, message)),
  }),
)(App);
