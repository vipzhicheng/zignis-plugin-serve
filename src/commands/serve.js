/**
 * TODO:
 * [*]: return format, base on Zhike api style, with errors by middleware ***
 * [*]: support pure response, ctx.json = false
 * [*]: restructure middlewares
 * [*]: port detect
 * [*]: simple route, function module as handler
 * [*]: speical route, index
 * []: zignis serve -l list all routes
 * []: zignis make route a/b/c/d 'desc'
 * []: README.md
 * []: Rewrite all not-found requests to `index.html`
 * [*]: http access log
 * [*]: support init script
 * [*]: support router middleware
 * [*]: disable internal middleware
 * [*]: validation support
 * [*]: watch mode, nodemon --exec 'zignis serve'
 * []: view & template
 * []: support sentry
 * []: directory file list
 */
const { Utils } = require('zignis')
const path = require('path')
const fs = require('fs')

const detect = require('detect-port');

const Koa = require('koa')
const app = new Koa()

const errorMiddleware = require('../middlewares/error')
const staticMiddleware = require('../middlewares/static')
const routeMiddleware = require('../middlewares/route')

const logger = require('koa-logger')
const cors = require('kcors')
const bodyParser = require('koa-bodyparser')

exports.command = 'serve [publicDir]'
exports.desc = 'simple server'

exports.builder = function (yargs) {
  yargs.option('port', { default: false, describe: 'server port', alias: 'p' })
  yargs.option('preprocess-koa', { default: false, describe: 'preprocess koa by application' })
  yargs.option('router-api-prefix', { default: '/api', describe: 'prefix all routes'})
  yargs.option('disable-internal-middleware-koa-logger', { describe: 'disable internal middleware koa-logger'})
  yargs.option('disable-internal-middleware-koa-bodyparser', { describe: 'disable internal middleware koa-bodyparser'})
  yargs.option('disable-internal-middleware-koa-kcors', { describe: 'disable internal middleware kcors'})
  yargs.option('disable-internal-middleware-koa-static', { describe: 'disable internal middleware koa-static'})
}

exports.handler = async function (argv) {
  const port = argv.port || 3000
  const appConfig = Utils.getApplicationConfig()

  // 错误处理
  app.use(errorMiddleware)
  
  // 允许应用插入一些中间件
  if (argv.initApp && fs.existsSync(path.resolve(appConfig.applicationDir, argv.initApp))) {
    require(path.resolve(appConfig.applicationDir, argv.initApp))(app)
  }

  argv.disableInternalMiddlewareKoaLogger || app.use(logger())
  argv.disableInternalMiddlewareKcors || app.use(cors({ credentials: true }))
  argv.disableInternalMiddlewareKoaBodyparser || app.use(bodyParser())
  argv.disableInternalMiddlewareKoaStatic || app.use(staticMiddleware(argv)) // 静态资源

  app.use(routeMiddleware(argv)) // 路由资源

  const _port = await detect(port)

  if (port == _port) {
    app.listen(port)
    console.log(`Running on http://127.0.0.1:${port}`);
  } else {
    app.listen(_port)
    console.log(`Port ${port} was occupied, use ${_port} instead`);
    console.log(`Running on http://127.0.0.1:${_port}`);
  }
}
