exports.validate = {
  username: 'required|min:4'
}

exports.middleware = []

exports.path = ':c'
// exports.method = 'post'
exports.handler = async (ctx) => {
  return 'hello 1111'
}