const send = require('koa-send')
const path = require('path')

module.exports = argv => {
  return async (ctx, next) => {
    await next()
    // 静态资源都只支持 HEAD 和 GET
    if (ctx.method !== 'HEAD' && ctx.method !== 'GET') return

    let opts = {
      root: path.resolve(argv.publicDir),
      index: argv.fileIndex
    }

    if (ctx.body != null || ctx.status !== 404) return

    try {
      // 尝试发送请求的静态资源
      await send(ctx, ctx.path, opts)
    } catch (err) {
      if (err.status !== 404) {
        throw err
      } else {
        if (!argv.spa) {
          // 通常情况下都是用 fileIndex 作为默认首页
          // 如果不是 SPA 还发生了404，就使用 file404 设置
          opts.index = argv.file404
        }

        // 发送404头
        ctx.status = 404
        if (!argv.file404 && !argv.spa) {
          ctx.body = 'Not found'
        } else {
          try {
            // 404时，发送默认静态资源，强制路径是首页，根据是否有 spa 选项使用不同的静态资源
            await send(ctx, '/', opts)
          } catch (err404) {
            throw err404
          }
        }

      }
    }
  }
}