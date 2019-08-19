const path = require('path')
const Koa = require('koa')
const app = new Koa()

const cors = require('kcors')
const bodyParser = require('koa-bodyparser')
const serve = require('koa-static')


exports.command = 'serve [publicDir]'
exports.desc = 'simple server'

exports.builder = function (yargs) {
  yargs.option('port', { default: false, describe: 'server port', alias: 'p' })
  // yargs.commandDir('serve')
}

exports.handler = async function (argv) {
  const port = argv.port || 3000
  
  const publicDir = path.resolve(argv.publicDir || '.')

  app.use(cors({ credentials: true }))
  app.use(bodyParser())
  app.use(serve(publicDir))

  app.listen(port)
  console.log(`Running on http://127.0.0.1:${port}`)
}
