/**
 * TODO:
 * []: return format, base on Zhike api style, with errors by middleware
 * []: README.md
 * []: zignis make route a/b/c/d 'desc'
 * []: zignis serve -l list all routes
 * [*]: http access log
 * [*]: support init script
 * [*]: support router middleware
 * [*]: disable internal middleware
 * [*]: validation support
 * []: watch mode
 * []: view & template
 */
const { Utils } = require('zignis')
const path = require('path')
const fs = require('fs')
const requireDirectory = require('require-directory')
const Koa = require('koa')
const app = new Koa()

const logger = require('koa-logger')
const cors = require('kcors')
const bodyParser = require('koa-bodyparser')

const serve = require('koa-static')
const Router = require('koa-router')
const router = new Router()

const { validate } = require('indicative/validator')

const travelRouter = (argv, routes, prefixPath = '') => {
  Object.keys(routes).forEach(name => {
    const route = routes[name]
    let routePath = `${prefixPath}/${name}`

    if (route.handler && Utils._.isFunction(route.handler)) {
      if (route.path) {
        routePath = `${routePath}/${route.path}`
      }
      const method = route.method ? Utils._.lowerCase(route.method) : 'get'

      let middlewares = route.middleware ? Utils._.castArray(route.middleware) : []
      if (route.handler) {
        middlewares.push(async (ctx) => {
          const input = method === 'get' ? Object.assign({}, ctx.params, ctx.query) : Object.assign({}, ctx.params, ctx.query, ctx.body)
  
          if (route.validate) {
            try {
              // https://indicative.adonisjs.com/validations/master/min
              await validate(input, route.validate, route.validate_messages, {
                cacheKey: ctx.url
              })
            } catch (e) {
              ctx.body = e
              return
            }
          }
          ctx.body = await route.handler(ctx)
        })
      }

      router[method](routePath, ...middlewares)
    } else if (Utils._.isObject(route)) {
      travelRouter(argv, route, routePath)
    } else {
      // Do nothing
    }
  })
}

exports.command = 'serve [publicDir]'
exports.desc = 'simple server'

exports.builder = function (yargs) {
  yargs.option('port', { default: false, describe: 'server port', alias: 'p' })
  yargs.option('init-app', { default: false, describe: 'preprocess koa by application', alias: 'init' })
  yargs.option('router-api-prefix', { default: '/api', describe: 'prefix all routes'})
  yargs.option('disable-internal-middleware-koa-logger', { describe: 'disable internal middleware koa-logger'})
  yargs.option('disable-internal-middleware-koa-bodyparser', { describe: 'disable internal middleware koa-bodyparser'})
  yargs.option('disable-internal-middleware-koa-kcors', { describe: 'disable internal middleware kcors'})
}

exports.handler = async function (argv) {
  const port = argv.port || 3000
  const appConfig = Utils.getApplicationConfig()
  
  if (argv.routerApiPrefix) {
    router.prefix(argv.routerApiPrefix)
  }

  const publicDir = argv.publicDir ? path.resolve(argv.publicDir) : null
  const routes = argv.routeDir ? requireDirectory(module, path.resolve(appConfig.applicationDir, argv.routeDir)) : null
  travelRouter(argv, routes)

  if (argv.initApp && fs.existsSync(path.resolve(appConfig.applicationDir, argv.initApp))) {
    require(path.resolve(appConfig.applicationDir, argv.initApp))(app)
  }

  argv.disableInternalMiddlewareKoaLogger || app.use(logger())
  argv.disableInternalMiddlewareKcors || app.use(cors({ credentials: true }))
  argv.disableInternalMiddlewareKoaBodyparser || app.use(bodyParser())

  publicDir && app.use(serve(publicDir))
  app.use(router.routes())

  app.listen(port)
  console.log(`Running on http://127.0.0.1:${port}`)
}
