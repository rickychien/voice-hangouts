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
  };

  state = {
    message: ''
  };

  async componentDidMount () {
    const stream = await this.props.connector.getUserMedia()
    this.props.setUser({ stream })
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
      return !mute ? ' mic' : 'mic_off'
    }

    return !mute ? ' volume_up' : ' volume_off'
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
                <i
                  className={styles.userControlIcon + ' material-icons'}
                  onClick={this.onUserControlClick}
                  disabled={!stream}
                  data-uid={uid}
                  data-mute={mute}
                >
                  { this.getUserControlIcon(uid, mute) }
                </i>
                <span className={styles.userListName}>{ userName }</span>
                {
                  stream && <VolumeMeter
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
            <i
              className={styles.sendButton + ' material-icons'}
              disabled={!chatRoomReady}
              value='Send'
              onClick={this.onSndMessage}
            >
              send
            </i>
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
