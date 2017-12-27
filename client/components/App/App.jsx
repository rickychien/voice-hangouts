import PropTypes from 'prop-types';
import React from 'react';
import { connect } from 'react-redux';

import Actions from '../../actions';
import LandingPage from '../LandingPage';
import Room from '../Room';

import styles from './App.css';

class App extends React.PureComponent {
  static propTypes = {
    connector: PropTypes.object.isRequired,
    user: PropTypes.object.isRequired,
    addMessage: PropTypes.func.isRequired,
  };

  state = {
    message: '',
  };

  componentDidMount() {
    window.addEventListener('beforeunload', this.onLeaveRoom);
  }

  componentWillUnmount() {
    window.removeEventListener(this.onLeaveRoom);
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
    const { user, connector } = this.props;

    return (
      <div className={ styles.app }>
        <h1 className={ styles.appTitle }>Voice Hangouts</h1>
        {
          !user.uid ? <LandingPage connector={ connector } /> : <Room connector={ connector } />
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
