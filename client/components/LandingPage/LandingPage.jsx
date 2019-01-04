import React, { createRef } from 'react'
import styles from './LandingPage.css'

const DOMAIN_URL = 'voice-hangouts.herokuapp.com/'

export default function LandingPage () {
  const inputRef = createRef()

  function joinRoom () {
    window.location.pathname = inputRef.current.value || 'Ballroom'
  }

  function onRoomNameKeyPress (evt) {
    if (evt.key === 'Enter') {
      joinRoom()
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
            ref={inputRef}
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
