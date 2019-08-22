/**
 * TODO:
 * [*]: http access log
 * []: middleware support
 * [*]: disable internal middleware
 * []: validation support
 * []: interception support
 */
const { Utils } = require('zignis')
const path = require('path')
const requireDirectory = require('require-directory')
const Koa = require('koa')
const app = new Koa()

const logger = require('koa-logger')
const cors = require('kcors')
const bodyParser = require('koa-bodyparser')
const serve = require('koa-static')
const Router = require('koa-router')
const router = new Router()

const travelRouter = (routes, prefixPath = '') => {
  Object.keys(routes).forEach(name => {
    const route = routes[name]
    let routePath = `${prefixPath}/${name}`

    if (route.handler && Utils._.isFunction(route.handler)) {
      if (route.path) {
        routePath = `${routePath}/${route.path}`
      }
      const method = route.method ? Utils._.lowerCase(route.method) : 'get'
      router[method](routePath, route.handler)
    } else if (Utils._.isObject(route)) {
      travelRouter(route, routePath)
    } else {
      // Do nothing
    }
  })
}

exports.command = 'serve [publicDir]'
exports.desc = 'simple server'

exports.builder = function (yargs) {
  yargs.option('port', { default: false, describe: 'server port', alias: 'p' })
  yargs.option('router-api-prefix', { default: '/api', describe: 'prefix all routes'})
  yargs.option('disable-internal-middleware-koa-logger', { describe: 'disable internal middleware koa-logger'})
  yargs.option('disable-internal-middleware-koa-bodyparser', { describe: 'disable internal middleware koa-bodyparser'})
  yargs.option('disable-internal-middleware-koa-kcors', { describe: 'disable internal middleware kcors'})
}

exports.handler = async function (argv) {
  const port = argv.port || 3000
  const appConfig = Utils.getApplicationConfig()
  // console.log(appConfig)
  
  if (argv.routerApiPrefix) {
    router.prefix(argv.routerApiPrefix)
  }

  const publicDir = path.resolve(argv.publicDir || '.')
  const routes = argv.routeDir ? requireDirectory(module, path.resolve(appConfig.applicationDir, argv.routeDir)) : null
  travelRouter(routes)
  // console.log(router.routes())

  argv.disableInternalMiddlewareKoaLogger || app.use(logger())
  argv.disableInternalMiddlewareKcors || app.use(cors({ credentials: true }))
  argv.disableInternalMiddlewareKoaBodyparser || app.use(bodyParser())

  app.use(serve(publicDir))
  app.use(router.routes())

  app.listen(port)
  console.log(`Running on http://127.0.0.1:${port}`)
}
