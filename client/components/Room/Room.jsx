import PropTypes from 'prop-types';
import React from 'react';
import { connect } from 'react-redux';

import Actions from '../../actions';

import styles from './Room.css';

class Room extends React.PureComponent {
  static propTypes = {
    connector: PropTypes.object.isRequired,
    clients: PropTypes.object.isRequired,
    messages: PropTypes.array.isRequired,
    user: PropTypes.object.isRequired,
    addMessage: PropTypes.func.isRequired,
  };

  state = {
    message: '',
  };

  onInputChange = (evt) => {
    const { target: { name, value } } = evt;
    this.setState({ [name]: value });
  }

  onSendMessage = (evt) => {
    const { key, type } = evt;
    const { message } = this.state;
    const { addMessage, connector, user } = this.props;

    if ((key === 'Enter' || type === 'click') && message) {
      addMessage(user.userName, message);
      connector.sendMessage(message);
      this.setState({ message: '' });
    }
  }

  render() {
    const { messages, clients } = this.props;
    const { message } = this.state;

    return (
      <div className={ styles.room }>
        <div className={ styles.messages }>
          {
            messages.map((msg) =>
              (
                <div key={ msg.mid }>
                  {`${msg.userName}: ${msg.message}`}
                </div>
              ),
            )
          }
        </div>
        <div className={ styles.messageBox }>
          <input
            autoFocus
            className={ styles.messageInput }
            name="message"
            placeholder="type message here..."
            value={ message }
            onChange={ this.onInputChange }
            onKeyPress={ this.onSendMessage }
          />
          <input
            className={ styles.sendButton }
            type="submit"
            value="Send"
            onClick={ this.onSendMessage }
          />
        </div>
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
)(Room);
