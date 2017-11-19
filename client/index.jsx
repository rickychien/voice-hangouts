import React from 'react';
import { render } from 'react-dom';
import { Provider } from 'react-redux';

import configureStore from './store';

import App from './components/App';

const store = configureStore({
  room: "",
});

render(
  <Provider store={store}>
    <App/>
  </Provider>,
  document.getElementById('root'),
);
