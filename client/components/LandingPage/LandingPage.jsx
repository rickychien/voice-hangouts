import React from 'react'
import styles from './LandingPage.css'

const DOMAIN_URL = 'voice-hangouts.herokuapp.com/'

class LandingPage extends React.PureComponent {
  inputRef = React.createRef()

  onRoomNameKeyPress = evt => {
    if (evt.key === 'Enter') {
      this.joinRoom()
    }
  }

  joinRoom = () => {
    window.location.pathname = this.inputRef.current.value || 'Ballroom'
  }

  render () {
    return (
      <div className={styles.landingPage}>
        <h1>Voice Hangouts</h1>
        <p key='subtitle'>Truly lightweight audio-only WebRTC chat</p>
        <div key='form' className={styles.startChatForm}>
          <span className={styles.createRoomInput}>
            <span className={styles.domain}>{DOMAIN_URL}</span>
            <input
              ref={this.inputRef}
              autoFocus
              className={styles.roomNameInput}
              placeholder='room'
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
