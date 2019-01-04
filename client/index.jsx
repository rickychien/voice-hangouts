import React from 'react'
import { render } from 'react-dom'
import { bindActionCreators } from 'redux'
import { Provider } from 'react-redux'
import 'webrtc-adapter'
import Actions from './actions'
import configureStore from './store'
import Connector from './connector'
import LandingPage from './components/LandingPage'
import Room from './components/Room'
import './index.css'

window.AudioContext = window.AudioContext || window.webkitAudioContext

const ROOM_NAME = window.location.pathname.replace('/', '') || ''
const HOST = location.href.replace(/^http/, 'ws')
const store = configureStore()
const actions = bindActionCreators(Actions, store.dispatch)
const connector = new Connector(HOST, actions, store)

render(
  <Provider store={store}>
    {!ROOM_NAME ? (
      <LandingPage connector={connector} />
    ) : (
      <Room connector={connector} />
    )}
  </Provider>,
  document.getElementById('root')
)
