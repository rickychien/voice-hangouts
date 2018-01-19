import React from 'react'

import styles from './LandingPage.css'

const DOMAIN_URL = 'voice-hangouts.herokuapp.com/'

class LandingPage extends React.PureComponent {
  state = {
    roomName: ''
  }

  onInputChange = (evt) => {
    const { target: { name, value } } = evt
    this.setState({ [name]: value })
  }

  onRoomNameKeyPress = (evt) => {
    if (evt.key === 'Enter') {
      this.joinRoom()
    }
  }

  joinRoom = () => {
    const roomName = this.state.roomName || 'Ballroom'
    window.location.pathname = `/${roomName}`
  }

  render () {
    const { roomName } = this.state

    return (
      <div className={styles.landingPage}>
        <h1>Voice Hangouts</h1>
        <p key='subtitle'>Truly lightweight audio-only WebRTC chat</p>
        <div key='form' className={styles.startChatForm}>
          <span className={styles.createRoomInput}>
            <span className={styles.domain}>{ DOMAIN_URL }</span>
            <input
              autoFocus
              className={styles.roomNameInput}
              name='roomName'
              placeholder='room'
              value={roomName}
              onChange={this.onInputChange}
              onKeyPress={this.onRoomNameKeyPress}
            />
          </span>
          <input
            className={styles.startChatButton}
            type='submit'
            value='Go'
            onClick={this.joinRoom}
          />
        </div>
      </div>
    )
  }
}

export default LandingPage
