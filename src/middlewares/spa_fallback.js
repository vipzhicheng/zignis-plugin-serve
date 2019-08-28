const send = require('koa-send')
const path = require('path')

module.exports = argv => {
  return async (ctx, next) => {
    await next()
    if (ctx.method !== 'HEAD' && ctx.method !== 'GET') return

    let opts = {
      root: path.resolve(argv.publicDir),
      index: 'index.html'
    }
    if (ctx.method === 'HEAD' || ctx.method === 'GET') {
      try {
        done = await send(ctx, ctx.path, opts)
      } catch (err) {
        if (err.status !== 404) {
          throw err
        } else if (argv.spa) {
          try {
            await send(ctx, '/', opts)
          } catch (noIndex) {
            throw noIndex
          }
        }
      }
    }
  }
}