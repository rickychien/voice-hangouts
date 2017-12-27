import PropTypes from 'prop-types';
import React from 'react';
import { connect } from 'react-redux';

import LandingPage from '../LandingPage';
import Room from '../Room';

import styles from './App.css';

const roomName = window.location.pathname.replace('/', '');

class App extends React.PureComponent {
  static propTypes = {
    connector: PropTypes.object.isRequired,
    user: PropTypes.object.isRequired,
  };

  componentDidMount() {
    const { connector } = this.props;

    connector.connect();

    if (roomName) {
      connector.joinRoom(roomName);
    }

    window.addEventListener('beforeunload', this.leaveRoom);
  }

  componentWillUnmount() {
    window.removeEventListener(this.leaveRoom);
  }

  leaveRoom = () => {
    const { user } = this.props;
    if (user.uid) {
      this.props.connector.leaveRoom(user.uid);
    }
  }

  render() {
    const { connector } = this.props;

    return (
      <div className={ styles.app }>
        <h1 className={ styles.appTitle }>Voice Hangouts</h1>
        {
          !roomName ? <LandingPage connector={ connector } /> : <Room connector={ connector } />
        }
      </div>
    );
  }
}

export default connect(
  (state) => ({
    user: state.user,
  }),
)(App);
