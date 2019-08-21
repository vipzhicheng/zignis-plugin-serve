
exports.path = ':c'
// exports.method = 'post'
exports.handler = async (ctx) => {
  console.log(ctx.query)
  console.log(ctx.params)
  ctx.body = 'hello 1111'
}