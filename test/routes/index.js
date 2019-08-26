// exports.path = 'd/e/f'

exports.handler = async (ctx) => {
  ctx.json = false
  return ctx.router.url('test', 3)
}