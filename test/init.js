module.exports = (app) => {
  app.use(async (ctx, next) => {
    console.log('here')
    await next()
  })

}