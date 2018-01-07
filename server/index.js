const Koa = require('koa')
const convert = require('koa-convert')
const Router = require('koa-router')
const send = require('koa-send')
const websockify = require('koa-websocket')

const SignalingService = require('./signaling-service')
const config = require('../webpack.config')

const isDev = process.env.NODE_ENV !== 'production'
const app = websockify(new Koa())
const router = new Router()
const wsRouter = new Router()
const PORT = process.env.PORT || 3000

function isStaticResource (url) {
  return url === '/bundle.js' || url.includes('/assets/')
}

router.get('/*', async (ctx) => {
  const path = isStaticResource(ctx.path) ? ctx.path : '/'
  await send(ctx, path, { index: 'index.html', root: `${config.output.path}` })
})

wsRouter.get('/*', (ctx) => {
  const signalingService = new SignalingService(app.ws.server.clients)
  const { websocket } = ctx
  websocket.on('message', (message) => {
    signalingService.onMessage(websocket, message)
  })
})

app.ws
  .use(wsRouter.routes())

if (isDev) {
  const webpack = require('webpack')
  const { devMiddleware, hotMiddleware } = require('koa-webpack-middleware')

  const devMiddlewareConfig = {
    publicPath: config.output.publicPath,
    stats: {
      colors: true
    }
  }
  const compiler = webpack(config)

  app
    .use(convert(devMiddleware(compiler, devMiddlewareConfig)))
    .use(convert(hotMiddleware(compiler)))
}

app
  .use(router.routes())
  .listen(PORT)
