const { Utils } = require('zignis')
const path = require('path')

const requireDirectory = require('require-directory')
const { validate } = require('indicative/validator')
const Router = require('koa-router')
const router = new Router()

const mock = require('mockjs')

const travelRouter = (argv, router, routes, prefixPath = '') => {
  Object.keys(routes).forEach(name => {
    let route = routes[name]
    let routePath = name === 'index' ? `${prefixPath ? prefixPath : '/'}` : `${prefixPath}/${name}`

    if (Utils._.isFunction(route)) {
      route = { handler: route } // simple route
    }

    if (route.handler && Utils._.isFunction(route.handler)) {
      if (route.path) {
        routePath = `${routePath}/${route.path}`
      }
      const method = route.method ? Utils._.lowerCase(route.method) : 'get'

      let middlewares = route.middleware ? Utils._.castArray(route.middleware) : []
      if (route.handler) {
        middlewares.push(async (ctx) => {
          ctx.router = router
          ctx.Mock = Mock
          ctx.mock = Mock.mock
          const input = method === 'get' ? Object.assign({}, ctx.params, ctx.query) : Object.assign({}, ctx.params, ctx.query, ctx.body)
  
          if (route.validate) {
            try {
              // https://indicative.adonisjs.com/validations/master/min
              await validate(input, route.validate, route.validate_messages, {
                cacheKey: ctx.url
              })
            } catch (e) {
              throw new ctx.Exception(3, '', e)
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
      routePath = routePath.replace(/\/+/g, '/')
      if (route.name && Utils._.isString(route.name)) {
        router[method](route.name, routePath, ...middlewares)
      } else {
        router[method](routePath, ...middlewares)
      }
      
    } else if (Utils._.isObject(route)) {
      travelRouter(argv, router, route, routePath)
    } else {
      // Do nothing
    }
  })
}

module.exports = (argv) => {
  const appConfig = Utils.getApplicationConfig()

  if (argv.apiPrefix) {
    router.prefix(argv.apiPrefix)
  }

  const routes = argv.routeDir ? requireDirectory(module, path.resolve(appConfig.applicationDir, argv.routeDir)) : null
  if (routes) {
    travelRouter(argv, router, routes)
  }
  router['all']('*', async ctx => {
    throw new ctx.Exception(4)
  })

  if (argv.list) {
    const publicDir = argv.publicDir ? path.resolve(argv.publicDir) : path.resolve('.')
    console.log(`${Utils.chalk.green('Static directory:')}`)
    console.log(publicDir)

    console.log()
    console.log(Utils.chalk.green('Routes:'))
    const headers = [Utils.chalk.cyan.bold('PATH'), Utils.chalk.cyan.bold('NAME'), Utils.chalk.cyan.bold('METHOD')]
    const rows = [headers]
    router.stack.forEach(item => {
      rows.push([
        item.path,
        item.name,
        item.methods.length > 30 ? 'ALL' : item.methods.join(', ')
      ])
    })

    console.log(Utils.table(rows))
    process.exit(0)
  }

  return router.routes()
}