const { Utils } = require('zignis')
const path = require('path')

const requireDirectory = require('require-directory')
const { validate } = require('indicative/validator')
const Router = require('koa-router')
const router = new Router()

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
          ctx.body = {
            reqId: ctx.reqId,
            code: 0
          }
          const handled = await route.handler(ctx)
          if (ctx.json) {
            ctx.body.data = handled
          } else {
            ctx.body = handled
          }

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

module.exports = (argv) => {
  const appConfig = Utils.getApplicationConfig()

  if (argv.routerApiPrefix) {
    router.prefix(argv.routerApiPrefix)
  }

  const routes = argv.routeDir ? requireDirectory(module, path.resolve(appConfig.applicationDir, argv.routeDir)) : null
  if (routes) {
    travelRouter(argv, routes)
  }
  router['all']('*', async ctx => {
    throw new ctx.Exception(4)
  })

  return router.routes()
}