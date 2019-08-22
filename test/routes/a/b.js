

exports.validate = {
  username: 'required|min:4'
}

exports.path = ':c'
// exports.method = 'post'
exports.handler = async (ctx) => {
  ctx.body = 'hello 1111'
}