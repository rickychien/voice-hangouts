import PropTypes from 'prop-types';
import React from 'react';
import { connect } from 'react-redux';

import Actions from '../../actions';
import LandingPage from '../LandingPage';
import Room from '../Room';

import styles from './App.css';

const roomName = window.location.pathname.replace('/', '');

class App extends React.PureComponent {
  static propTypes = {
    connector: PropTypes.object.isRequired,
    setUser: PropTypes.func.isRequired,
  };

  componentDidMount() {
    const { connector, setUser } = this.props;

    connector.connect();

    const userProfile = roomName && window.localStorage.getItem(roomName);

    if (userProfile) {
      setUser(JSON.parse(userProfile));
    } else {
      setUser({ userName: 'Guest', roomName });
    }

    // If url contains pathname, we treat it as a room name and join the room
    if (roomName) {
      connector.joinRoom();
    }

    window.addEventListener('beforeunload', this.leaveRoom);
  }

  componentWillUnmount() {
    window.removeEventListener(this.leaveRoom);
  }

  leaveRoom = () => {
    this.props.connector.leaveRoom();
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
  null,
  (dispatch) => ({
    setUser: (payload) => dispatch(Actions.setUser(payload)),
  }),
)(App);
