const fs = require('fs')
const path = require('path')
const { Utils } = require('zignis')

exports.command = 'route <name>'
exports.desc = 'Generate a route template'
// exports.aliases = ''

exports.builder = function (yargs) {
}

exports.handler = function(argv) {
  const routeDir = argv.routeMakeDir || argv.routeDir
  if (!routeDir || !fs.existsSync(routeDir)) {
    console.log(Utils.chalk.red('"routeDir" missing in config file or not exist in current directory!'))
    return
  }

  const routeFilePath = path.resolve(routeDir, `${argv.name}.js`)
  const routeFileDir = path.dirname(routeFilePath)

  Utils.fs.ensureDirSync(routeFileDir)
  if (fs.existsSync(routeFilePath)) {
    Utils.error(chalk.red('Route file exist!'))
  }

  let code = `// exports.name = '' // 路由名字，非必填
// exports.path = '' // 追加额外的路由，非必填
// exports.method = 'get' // 路由方法，默认 get，非必填
// // https://indicative.adonisjs.com/validations/master/min
// exports.middleware = [] // 为单个路由指定前置中间件
// exports.validate = {
//   username: 'min:6' 
// }
exports.handler = async ctx => {
  // ctx.errors[11] = '错误'
  ctx.json = true // 返回JSON数据结构
  return 'hello'
}
`
  if (!fs.existsSync(routeFilePath)) {
    fs.writeFileSync(routeFilePath, code)
    console.log(Utils.chalk.green(`${routeFilePath} created!`))
  }
}
