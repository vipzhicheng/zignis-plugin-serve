exports.validate = {
  username: 'required|min:4'
}

exports.name = 'test'
// exports.middleware = []

// exports.path = ':c'
// exports.method = 'post'
exports.handler = async (ctx) => {
  // throw new ctx.Exception(11)

  return 'hello 1111'
}