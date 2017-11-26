import React from 'react';
import { render } from 'react-dom';
import { bindActionCreators } from 'redux';
import { Provider } from 'react-redux';

import Actions from './actions';
import configureStore from './store';
import Connector from './connector';
import App from './components/App';

const store = configureStore();
const actions = bindActionCreators(Actions, store.dispatch);
const connector = new Connector('ws://localhost:3000/message', actions, store);

render(
  <Provider store={ store }>
    <App connector={ connector } />
  </Provider>,
  document.getElementById('root'),
);
