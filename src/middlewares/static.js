const send = require('koa-send')
const path = require('path')

module.exports = argv => {
  return async (ctx, next) => {
    await next()
    if (ctx.method !== 'HEAD' && ctx.method !== 'GET') return

    let opts = {
      root: path.resolve(argv.publicDir),
      index: argv.fileIndex
    }
    if (ctx.method === 'HEAD' || ctx.method === 'GET') {
      if (ctx.body != null || ctx.status !== 404) return

      try {
        await send(ctx, ctx.path, opts)
      } catch (err) {
        if (err.status !== 404) {
          throw err
        } else {
          if (!argv.spa) {
            opts.index = argv.file404
          }

          if (!argv.file404 && !argv.spa) {
            ctx.body = 'Not found'
          } else {
            try {
              // TODO: send 404 header
              await send(ctx, '/', opts)
            } catch (err404) {
              throw err404
            }
          }

        }
      }
    }
  }
}