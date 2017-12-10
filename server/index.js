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
const PORT = 3000;

const isDev = process.env.NODE_ENV !== "production";
const devMiddlewareConfig = {
  publicPath: config.output.publicPath,
  stats: {
    colors: true,
  },
};

router.get('/*', async (ctx) => {
  await send(ctx, ctx.path, { index: 'index.html', root: `${config.output.path}` });
});

wsRouter.get('/', (ctx) => {
  const hangout = new Hangout(app.ws.server.clients);
  const { websocket } = ctx;
  websocket.on('message', (message) => {
    hangout.onMessage(websocket, message);
  });
});

app.ws
  .use(wsRouter.routes());

if (isDev) {
  app
    .use(convert(devMiddleware(compiler, devMiddlewareConfig)))
    .use(convert(hotMiddleware(compiler)));
}

app
  .use(router.routes())
  .listen(PORT);
