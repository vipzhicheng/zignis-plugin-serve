module.exports = (app) => {
  app.use(async (ctx, next) => {
    await next()
  })

}