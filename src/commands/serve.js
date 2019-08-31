/**
 * TODO:
 * [*]: write more comments
 * [*]: send 404 header when 404
 * [*]: enable gzip for text content type
 * [*]: mock inside
 * [*]: support spa mode and 404 mode
 * [*]: return format, base on Zhike api style, with errors by middleware ***
 * [*]: support pure response, ctx.json = false
 * [*]: restructure middlewares
 * [*]: port detect
 * [*]: simple route, function module as handler
 * [*]: speical route, index
 * [*]: zignis serve -l list all routes
 * [*]: zignis make route a/b/c/d 'desc'
 * [*]: README.md
 * [*]: Rewrite all not-found requests to `index.html`
 * [*]: http access log
 * [*]: support init script
 * [*]: support router middleware
 * [*]: disable internal middleware
 * [*]: validation support
 * [*]: watch mode, nodemon --exec 'zignis serve'
 * [-]: view & template
 * [-]: support sentry
 * []: debug
 * []: directory file list
 */
const { Utils } = require('zignis')
const path = require('path')
const fs = require('fs')
const boxen = require('boxen')

const detect = require('detect-port');

const Koa = require('koa')
const app = new Koa()

const errorMiddleware = require('../middlewares/error')
const staticMiddleware = require('../middlewares/static')
const routerMiddleware = require('../middlewares/router')

const logger = require('koa-logger')
const cors = require('kcors')
const bodyParser = require('koa-bodyparser')
const compress = require('koa-compress')

exports.command = 'serve [publicDir]'
exports.desc = 'simple server tool'

exports.builder = function (yargs) {
  yargs.option('port', { default: false, describe: 'server port', alias: 'p' })
  yargs.option('list', { describe: 'list routes', alias: 'l' })
  yargs.option('init-koa', { default: false, describe: 'initial koa application', alias: 'i' })
  yargs.option('api-prefix', { default: '/api', describe: 'prefix all routes'})
  yargs.option('spa', { describe: 'fallback to index.html' })
  yargs.option('gzip', { describe: 'enable gzip' })
  yargs.option('routeDir', { describe: 'routes location' })
  yargs.option('publicDir', { describe: 'static files location' })
  yargs.option('file-index', { default: 'index.html', describe: 'index file name' })
  yargs.option('file-404', { default: false, describe: 'index file name' })
  yargs.option('disable-internal-middleware-custom-error', { describe: 'disable internal middleware custom error'})
  yargs.option('disable-internal-middleware-custom-static', { describe: 'disable internal middleware custom static'})
  yargs.option('disable-internal-middleware-custom-router', { describe: 'disable internal middleware custom router'})
  yargs.option('disable-internal-middleware-koa-logger', { describe: 'disable internal middleware koa-logger'})
  yargs.option('disable-internal-middleware-koa-bodyparser', { describe: 'disable internal middleware koa-bodyparser'})
  yargs.option('disable-internal-middleware-koa-kcors', { describe: 'disable internal middleware kcors'})
}

exports.handler = async function (argv) {
  const port = argv.port || 3000
  const appConfig = Utils.getApplicationConfig()

  // 错误处理
  argv.disableInternalMiddlewareCustomError || app.use(errorMiddleware)
  
  // 允许应用插入一些中间件
  if (argv.initApp && fs.existsSync(path.resolve(appConfig.applicationDir, argv.initApp))) {
    require(path.resolve(appConfig.applicationDir, argv.initApp))(app)
  }

  // 加载常用中间件
  argv.disableInternalMiddlewareKoaLogger || app.use(logger())
  argv.disableInternalMiddlewareKcors || app.use(cors({ credentials: true }))
  argv.disableInternalMiddlewareKoaBodyparser || app.use(bodyParser())

  // 支持 Gzip
  if (argv.gzip) {
    app.use(compress({
      filter: function (content_type) {
        return /text/i.test(content_type)
      },
      threshold: 2048,
      flush: require('zlib').Z_SYNC_FLUSH
    }))
  }

  if (!argv.disableInternalMiddlewareCustomStatic) {
    argv.publicDir = argv.publicDir || '.'
    if (!fs.existsSync(path.resolve(argv.publicDir))) {
      Utils.error('Invalid public dir.')
    }

    if (argv.spa && argv.fileIndex && !fs.existsSync(path.resolve(argv.publicDir, argv.fileIndex))) {
      Utils.error('Invalid file index')
    }

    if (argv.file404 && !fs.existsSync(path.resolve(argv.publicDir, argv.file404))) {
      Utils.error('Invalid file 404')
    }

    // 加载静态资源
    app.use(staticMiddleware(argv))
  }

  // 加载路由
  argv.disableInternalMiddlewareCustomRouter || app.use(routerMiddleware(argv)) // 路由资源


  // 给启动信息加个框
  const box = [Utils.chalk.green('Zignis Serving!'), '']

  // 端口检测
  const _port = await detect(port)

  if (port == _port) {
    app.listen(port)
    box.push(Utils.chalk.bold(`Location: `) + Utils.chalk.green(`http://localhost:${port}`))
  } else {
    app.listen(_port)
    box.push(`Port ${port} was occupied, use ${_port} instead`);
    box.push(Utils.chalk.bold(`Location: `) + Utils.chalk.green(`http://localhost:${_port}`))
  }
  box.push(Utils.chalk.bold('- spa: ') + (argv.spa ? Utils.chalk.green('on'): Utils.chalk.red('off')))
  box.push(Utils.chalk.bold('- gzip: ') + (argv.gzip ? Utils.chalk.green('on'): Utils.chalk.red('off')))

  console.log(boxen(box.join('\n'), {
    margin: 1,
    padding: 1,
    borderColor: 'green'
  }))
}
