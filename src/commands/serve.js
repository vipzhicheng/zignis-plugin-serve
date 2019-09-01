/**
 * TODO:
 * [*]: beautify launch message
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
const os = require('os')
const boxen = require('boxen')
const isRoot = require('is-root')

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
  yargs.option('routeDir', { default: false, describe: 'routes location' })
  yargs.option('publicDir', { default: '.', describe: 'static files location' })
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
  let port = parseInt(argv.port, 10) || 3000
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

  // 加载静态资源
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

    app.use(staticMiddleware(argv))
  }

  // 加载动态路由
  argv.disableInternalMiddlewareCustomRouter || app.use(routerMiddleware(argv))


  // 给启动信息加个框
  const box = [Utils.chalk.green('Zignis Serving!'), '']

  // 端口检测
  const message =
    process.platform !== 'win32' && port < 1024 && !isRoot()
      ? `Admin permissions are required to run a server on a port below 1024.`
      : `Something is already running on port ${port}.`;


  const _port = await detect(port)

  if (port !== _port) {
    const question = {
      name: 'shouldChangePort',
      type: 'confirm',
      message: Utils.chalk.yellow(message + `\n\nWould you like to run on another port instead?`),
      default: true
    }
    const confirm = await Utils.inquirer.prompt(question)
    if (confirm.shouldChangePort) {
      port = _port
    } else {
      console.log(Utils.chalk.cyan('Aborted!'))
      process.exit(0)
    }
  }

  // HOST地址检测
  const localhost = 'http://localhost'
  const interface = Utils._.chain(os.networkInterfaces()).flatMap().find(o => o.family === 'IPv4' && o.internal === false).value()
  const nethost = interface ? `http://${interface.address}` : null

  app.listen(port)

  // 清除终端，copy from package: react-dev-utils
  function clearConsole() {
    process.stdout.write(
      process.platform === 'win32' ? '\x1B[2J\x1B[0f' : '\x1B[2J\x1B[3J\x1B[H'
    );
  }
  process.stdout.isTTY && clearConsole()

  box.push(Utils.chalk.bold(`Local: `) + Utils.chalk.green(`${localhost}:${_port}`))
  if (nethost) {
    box.push(Utils.chalk.bold(`Network: `) + Utils.chalk.green(`${nethost}:${_port}`))
  }
  box.push(Utils.chalk.bold('- spa: ') + (argv.spa ? Utils.chalk.green('on'): Utils.chalk.red('off')))
  box.push(Utils.chalk.bold('- gzip: ') + (argv.gzip ? Utils.chalk.green('on'): Utils.chalk.red('off')))

  console.log(boxen(box.join('\n'), {
    margin: 1,
    padding: 1,
    borderColor: 'green'
  }))
}
