import React from 'react'
import { render } from 'react-dom'
import { bindActionCreators } from 'redux'
import { Provider } from 'react-redux'
import 'webrtc-adapter'
import Actions from './actions'
import configureStore from './store'
import Connector from './connector'
import App from './components/App'

const HOST = window.location.href.replace(/^http/, 'ws')
const store = configureStore()
const actions = bindActionCreators(Actions, store.dispatch)
const connector = new Connector(HOST, actions, store)

render(
  <Provider store={store}>
    <App connector={connector} />
  </Provider>,
  document.getElementById('root')
)
