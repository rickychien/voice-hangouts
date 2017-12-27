import PropTypes from 'prop-types';
import React from 'react';

import styles from './LandingPage.css';

const DOMAIN_URL = 'voice-hangouts.herokuapp.com/';

class LandingPage extends React.PureComponent {
  static propTypes = {
    connector: PropTypes.object.isRequired,
  };

  state = {
    roomName: '',
  };

  onJoinRoom = () => {
    this.props.connector.connect(this.state.roomName || 'ballroom');
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

  render() {
    const { roomName } = this.state;

    return [
      <p key="subtitle">Truly lightweight audio-only WebRTC chat</p>,
      <div key="form" className={ styles.startChatForm }>
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
      </div>,
    ];
  }
}

export default LandingPage;
