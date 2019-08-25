const serve = require('koa-static')
const path = require('path')

module.exports = (argv) => {
  const publicDir = argv.publicDir ? path.resolve(argv.publicDir) : null
  return publicDir ? serve(publicDir) : async (ctx, next) => {
    await next()
  }
}