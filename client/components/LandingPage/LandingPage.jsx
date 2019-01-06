import React from 'react'
import styles from './LandingPage.css'

const DOMAIN_URL = 'voice-hangouts.herokuapp.com/'

function LandingPage () {
  function joinRoom ({ currentTarget }) {
    window.location.pathname = currentTarget.value || 'Ballroom'
  }

  function onRoomNameKeyPress (evt) {
    if (evt.key === 'Enter') {
      joinRoom(evt)
    }
  }

  return (
    <div className={styles.landingPage}>
      <h1>Voice Hangouts</h1>
      <p key='subtitle'>Truly lightweight audio-only WebRTC chat</p>
      <div key='form' className={styles.startChatForm}>
        <span className={styles.createRoomInput}>
          <span className={styles.domain}>{DOMAIN_URL}</span>
          <input
            autoFocus
            className={styles.roomNameInput}
            placeholder='room'
            onKeyPress={onRoomNameKeyPress}
          />
        </span>
        <input
          className={styles.startChatButton}
          type='submit'
          value='Go'
          onClick={joinRoom}
        />
      </div>
    </div>
  )
}

export default LandingPage
