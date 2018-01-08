import PropTypes from 'prop-types'
import React from 'react'
import { connect } from 'react-redux'

import Actions from '../../actions'
import VolumeMeter from '../VolumeMeter'

import styles from './Room.css'

class Room extends React.PureComponent {
  static propTypes = {
    connector: PropTypes.object.isRequired,
    chatRoomReady: PropTypes.bool.isRequired,
    clients: PropTypes.object.isRequired,
    messages: PropTypes.array.isRequired,
    setUser: PropTypes.func.isRequired,
    toggleUserAudio: PropTypes.func.isRequired,
    user: PropTypes.object.isRequired
  }

  state = {
    message: ''
  }

  async componentDidMount () {
    const { connector } = this.props
    const stream = await connector.getUserMedia()
    this.props.setUser({ stream })
    window.addEventListener('beforeunload', this.onLeaveRoom)
  }

  componentWillUnmount () {
    window.removeEventListener(this.onLeaveRoom)
  }

  onEditUserName = () => {
    const { connector, setUser, user } = this.props
    const userName = window.prompt('Edit your username:', this.props.user.userName)
    setUser({ userName })
    connector.sendUpdate({ uid: user.uid, userName })
  }

  onInputChange = (evt) => {
    const { target: { name, value } } = evt
    this.setState({ [name]: value })
  }

  onLeaveRoom = () => {
    this.props.connector.leaveRoom()
  }

  onSendMessage = (evt) => {
    const { key, type } = evt
    const { message } = this.state
    const { connector } = this.props

    if ((key === 'Enter' || type === 'click') && message) {
      connector.sendMessage(message)
      this.setState({ message: '' })
    }
  }

  onUserControlClick = ({ target }) => {
    const { connector } = this.props
    const { uid } = target.dataset

    connector.toggleMediaStream(uid)
    this.props.toggleUserAudio(uid)
  }

  getUserControlIcon = (uid, mute) => {
    if (this.props.user.uid === uid) {
      return !mute ? styles.mic : styles.micOff
    }

    return !mute ? styles.volumeUp : styles.volumeOff
  }

  getUserName = (uid) => {
    const { clients, user } = this.props
    if (uid === user.uid) {
      return user.userName
    }

    const client = clients.get(uid)
    return client ? client.userName : 'Guest'
  }

  isUrl (url) {
    return /(\b(https?|ftp|file):\/\/[-A-Z0-9+&@#/%?=~_|!:,.;]*[-A-Z0-9+&@#/%=~_|])/ig.test(url)
  }

  render () {
    const { chatRoomReady, clients, connector, messages, user } = this.props
    const { message } = this.state
    const users = [user, ...Array.from(clients.values())].filter((client) => client.uid)

    return (
      <div className={styles.room}>
        <div className={styles.userList}>
          <h3>Voice Hangouts</h3>
          {
            users.map(({ uid, userName, stream, mute }) => (
              <div key={uid} className={styles.userListRow}>
                <button
                  className={styles.userControlIcon + ' ' + this.getUserControlIcon(uid, mute)}
                  onClick={this.onUserControlClick}
                  disabled={!stream}
                  data-uid={uid}
                  data-mute={mute}
                />
                <span className={styles.userListName}>{ userName }</span>
                {
                  false && <VolumeMeter
                    connector={connector}
                    enabled={!!stream && !mute}
                    stream={stream}
                  />
                }
              </div>
            ))
          }
        </div>
        <div className={styles.chatRoom}>
          <div className={styles.messages}>
            {
              messages.map((msg) =>
                (
                  <div key={msg.mid} className={styles.messageRow}>
                    <div className={styles.messageUser}>
                      { `${this.getUserName(msg.uid)}:` }
                    </div>
                    <div className={styles.messageContent}>
                      {
                        !this.isUrl(msg.message)
                          ? msg.message
                          : <a target='_blank' href={msg.message}>{ msg.message }</a>
                      }
                    </div>
                    <div
                      className={styles.timestamp}
                      title={msg.timestamp.toLocaleDateString()}
                    >
                      { `${msg.timestamp.toLocaleTimeString()}` }
                    </div>
                  </div>
                )
              )
            }
          </div>
          <div className={styles.messageBox} disabled={!chatRoomReady}>
            <button
              className={styles.userNameBox}
              title='Click to edit your name'
              onClick={this.onEditUserName}
              onKeyPress={this.onEditUserName}
            >
              <span className={styles.userName}>{ user.userName }</span>
            </button>
            <input
              autoFocus
              className={styles.messageInput}
              disabled={!chatRoomReady}
              name='message'
              placeholder='type message here...'
              value={message}
              onChange={this.onInputChange}
              onKeyPress={this.onSendMessage}
            />
            <button
              className={styles.sendButton}
              disabled={!chatRoomReady}
              value='Send'
              onClick={this.onSndMessage}
            />
          </div>
        </div>
        {
          Array.from(clients).filter(([, peer]) => peer.streamUrl).map(([id, peer]) => (
            <audio
              key={id}
              autoPlay
              src={peer.streamUrl}
            />
          ))
        }
      </div>
    )
  }
}

export default connect(
  (state) => ({
    clients: state.clients,
    chatRoomReady: state.chatRoomReady,
    messages: state.messages,
    user: state.user
  }),
  (dispatch) => ({
    addMessage: (userName, message) => dispatch(Actions.addMessage(userName, message)),
    setUser: (payload) => dispatch(Actions.setUser(payload)),
    toggleUserAudio: (uid) => dispatch(Actions.toggleUserAudio(uid))
  })
)(Room)
