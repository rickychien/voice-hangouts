import PropTypes from 'prop-types'
import React, { useEffect } from 'react'
import { connect } from 'react-redux'
import Actions from '../../actions'
import VolumeMeter from '../VolumeMeter'
import styles from './Room.css'

function Room ({
  chatRoomReady,
  clients,
  connector,
  messages,
  setUser,
  toggleUserAudio,
  user
}) {
  useEffect(async () => {
    connector.connect()
    connector.joinRoom()
    setUser({ stream: await connector.getUserMedia() })
    window.addEventListener('beforeunload', onLeaveRoom)

    return () => {
      window.removeEventListener(onLeaveRoom)
    }
  }, [])

  function onEditUserName () {
    const userName = window.prompt('Edit your username:', user.userName)
    setUser({ userName })
    connector.sendUpdate({ uid: user.uid, userName })
  }

  function onLeaveRoom () {
    connector.leaveRoom()
  }

  function onSendMessage ({ key, type, currentTarget }) {
    const message = currentTarget.value

    if ((key === 'Enter' || type === 'click') && message) {
      connector.sendMessage(message)
      currentTarget.value = ''
    }
  }

  function onUserControlClick ({ target }) {
    const { uid } = target.dataset

    connector.toggleMediaStream(uid)
    toggleUserAudio(uid)
  }

  function getUserControlIcon (uid, mute) {
    if (user.uid === uid) {
      return !mute ? styles.mic : styles.micOff
    } else {
      return !mute ? styles.volumeUp : styles.volumeOff
    }
  }

  function getUserName (uid) {
    if (uid === user.uid) {
      return user.userName
    }

    const client = clients.get(uid)
    return client ? client.userName : 'Guest'
  }

  function isUrl (url) {
    return /(\b(https?|ftp|file):\/\/[-A-Z0-9+&@#/%?=~_|!:,.;]*[-A-Z0-9+&@#/%=~_|])/gi.test(
      url
    )
  }

  const users = [user, ...Array.from(clients.values())].filter(
    client => client.uid
  )

  return (
    <div className={styles.room}>
      <div className={styles.userList}>
        <h3>Voice Hangouts</h3>
        {users.map(({ uid, userName, stream, mute }) => (
          <div key={uid} className={styles.userListRow}>
            <button
              className={
                styles.userControlIcon + ' ' + getUserControlIcon(uid, mute)
              }
              onClick={onUserControlClick}
              disabled={!stream}
              data-uid={uid}
              data-mute={mute}
            />
            <span className={styles.userListName}>{userName}</span>
            {stream && (
              <VolumeMeter enabled={!!stream && !mute} stream={stream} />
            )}
          </div>
        ))}
      </div>
      <div className={styles.chatRoom}>
        <div className={styles.messages}>
          {messages.map(msg => (
            <div key={msg.mid} className={styles.messageRow}>
              <div className={styles.messageUser}>
                {`${getUserName(msg.uid)}:`}
              </div>
              <div className={styles.messageContent}>
                {!isUrl(msg.message) ? (
                  msg.message
                ) : (
                  <a target='_blank' href={msg.message}>
                    {msg.message}
                  </a>
                )}
              </div>
              <div
                className={styles.timestamp}
                title={msg.timestamp.toLocaleDateString()}
              >
                {`${msg.timestamp.toLocaleTimeString()}`}
              </div>
            </div>
          ))}
        </div>
        <div className={styles.messageBox} disabled={!chatRoomReady}>
          <button
            className={styles.userNameBox}
            title='Click to edit your name'
            onClick={onEditUserName}
            onKeyPress={onEditUserName}
          >
            <span className={styles.userName}>{user.userName}</span>
          </button>
          <input
            autoFocus
            className={styles.messageInput}
            disabled={!chatRoomReady}
            placeholder='type message here...'
            onKeyPress={onSendMessage}
          />
          <button
            className={styles.sendButton}
            disabled={!chatRoomReady}
            value='Send'
            onClick={onSendMessage}
          />
        </div>
      </div>
      {Array.from(clients)
        .filter(([, peer]) => peer.streamUrl)
        .map(([id, peer]) => (
          <audio key={id} autoPlay src={peer.streamUrl} />
        ))}
    </div>
  )
}

Room.propTypes = {
  connector: PropTypes.object.isRequired,
  chatRoomReady: PropTypes.bool.isRequired,
  clients: PropTypes.object.isRequired,
  messages: PropTypes.array.isRequired,
  setUser: PropTypes.func.isRequired,
  toggleUserAudio: PropTypes.func.isRequired,
  user: PropTypes.object.isRequired
}

export default connect(
  state => ({
    clients: state.clients,
    chatRoomReady: state.chatRoomReady,
    messages: state.messages,
    user: state.user
  }),
  dispatch => ({
    addMessage: (userName, message) =>
      dispatch(Actions.addMessage(userName, message)),
    setUser: payload => dispatch(Actions.setUser(payload)),
    toggleUserAudio: uid => dispatch(Actions.toggleUserAudio(uid))
  })
)(Room)
