const path = require('path');
const Koa = require('koa');
const convert = require('koa-convert');
const Router = require('koa-router');
const send = require('koa-send');
const websockify = require('koa-websocket');
const webpack = require('webpack');
const { devMiddleware, hotMiddleware } = require('koa-webpack-middleware');

const Hangout = require('./hangout');
const config = require('../webpack.config');

const compiler = webpack(config);
const app = websockify(new Koa());
const router = new Router();
const wsRouter = new Router();
const hangout = new Hangout();
const PORT = 3000;

const workDir = path.resolve(__dirname, '..');

router.get('/*', async (ctx) => {
  await send(ctx, ctx.path, { index: 'public/index.html', root: `${workDir}` });
});

wsRouter.get('/message', (ctx) => {
  const { websocket } = ctx;
  websocket.on('message', (message) => {
    hangout.onMessage(websocket, message);
  });
});

app.ws
  .use(wsRouter.routes());

app
  .use(convert(devMiddleware(compiler, {
    noInfo: true,
    publicPath: config.output.publicPath,
    stats: {
      colors: true,
    },
  })))
  .use(convert(hotMiddleware(compiler)))
  .use(router.routes())
  .listen(PORT);
