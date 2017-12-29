# Voice Hangouts

Voice hangouts with your friends

## Prerequisites

* [node] >= 9.3.0
* [npm] >= 5.6.0
* [yarn] >= 1.3.2

## Techniques

* [react] - A declarative, efficient, and flexible JavaScript library for building user interfaces.
* [redux] - a predictable state container for JavaScript apps.
* [react-redux] - Official React bindings for Redux
* [react-router] - A complete routing library for React
* [redux-thunk] - Allows you to write action creators that return a function instead of an action.
* [webpack] - module bundler.
* [babel] - A compiler for writing next generation JavaScript.
* [css-modules] - Modulize CSS.

### Development Guide

#### Development

1. Install packages by [npm] or [yarn]

  ```
  yarn install
  ```

2. Start webpack dev server

  ```
  yarn start
  ```

3. Visit <http://localhost:3000> in browser

#### Production

  Production build will exclude unnecessary resources (e.g. [redux-logger] only enable in development mode), minimizing resources and shipping production build libraries for real website experience.

  ```
  yarn build
  ```

  To check production result, just spinning up a local server under public folder. For example you can launch a python static file server in public folder by:

  ```
  python -m SimpleHTTPServer
  ```

  and visit <http://localhost:8000>

#### Clean up artifact resources
  ```
  yarn clean
  ```

## Application State Structure

  TBD

[node]: https://nodejs.org/
[npm]: https://www.npmjs.com/
[yarn]: https://yarnpkg.com/
[react]: https://github.com/facebook/react
[redux]: http://redux.js.org/
[react-redux]: https://github.com/reactjs/react-redux
[react-router]: https://github.com/reactjs/react-router
[redux-thunk]: https://github.com/gaearon/redux-thunk
[webpack]: https://github.com/webpack/webpack
[babel]: https://github.com/babel/babel
[css-modules]: https://github.com/css-modules/css-modules
[redux-logger]: https://github.com/fcomb/redux-logger
