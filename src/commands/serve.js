/**
 * TODO:
 * [*]: return format, base on Zhike api style, with errors by middleware ***
 * []: 404 handler
 * []: crsf
 * []: etags
 * []: compress
 * []: README.md
 * []: zignis make route a/b/c/d 'desc'
 * []: zignis serve -l list all routes
 * [*]: http access log
 * [*]: support init script
 * [*]: support router middleware
 * [*]: disable internal middleware
 * [*]: validation support
 * []: change to winston logger
 * []: watch mode
 * []: view & template
 * []: support sentry
 */
const { Utils } = require('zignis')
const path = require('path')
const fs = require('fs')
const requireDirectory = require('require-directory')
const Koa = require('koa')
const onerror = require('koa-onerror')
const app = new Koa()
onerror(app)
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
              throw new ctx.Exception(2, '', e)
            }
          }
          ctx.body.data = await route.handler(ctx)
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
  yargs.option('preprocess-koa', { default: false, describe: 'preprocess koa by application' })
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
  router['all']('*', ctx => {
    throw new ctx.Exception(4)
  })

  if (argv.initApp && fs.existsSync(path.resolve(appConfig.applicationDir, argv.initApp))) {
    require(path.resolve(appConfig.applicationDir, argv.initApp))(app)
  }

  argv.disableInternalMiddlewareKoaLogger || app.use(logger())

  app.use(async (ctx, next) => {
    ctx.errors = Object.assign({}, {
      1: { msg: '未知错误', status: 500 },
      2: { msg: '参数校验失败'},
      4: { msg: '页面未找到', status: 400 }
    }, ctx.errors)
    class Exception extends Error {
      constructor (code, msg, info) {
        let errMsg
        let status
        let errCode = code || 1 // 默认 code = 1
        if (msg || ctx.errors[errCode]) {
          errMsg = msg || ctx.errors[errCode].msg || ''
          status = ctx.errors[errCode].status || 200
        } else {
          errMsg = '未定义错误'
          status = 500
        }

        super(errMsg)

        this.code = errCode
        this.msg = errMsg
        this.status = status
        this.info = info
      }
    }

    ctx.Exception = Exception
    try {
      let startTime = new Date()
      ctx.reqId = Utils.day(startTime).format('YYYYMMDD_HHmm_ssSSS') + '_' + Utils._.padStart(Utils._.random(0, 0xffffffff).toString(16), 8, 0)
      ctx.body = {
        reqId: ctx.reqId,
        code: 0
      }

      await next()
    } catch (e) {
      console.error(e)
      if (e instanceof Exception) { // 有准备的已知错误
        ctx.status = e.status
        ctx.body = {
          reqId: ctx.reqId,
          code: e.code,
          msg: e.msg
        }

        if (e.info) {
          ctx.body.info = e.info
        }

      } else { // 未知错误
        ctx.status = 500
        ctx.body = {
          reqId: ctx.reqId,
          code: 1,
          msg: '未知错误'
        }
        
      }
      if (process.env.NODE_ENV !== 'production' && e) {
        ctx.body.stack = e.stack // 调用栈返给前端
      }
    }
  })

  argv.disableInternalMiddlewareKcors || app.use(cors({ credentials: true }))
  argv.disableInternalMiddlewareKoaBodyparser || app.use(bodyParser())

  publicDir && app.use(serve(publicDir))
  app.use(router.routes())

  app.listen(port)
  console.log(`Running on http://127.0.0.1:${port}`)
}
