module.exports = (app) => {
  app.use(async (ctx, next) => {
    // ctx.errors = {
    //   11: { msg: '捕获错误'}
    // }
    await next()
  })

}