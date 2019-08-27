const { Utils } = require('zignis')

exports.command = 'route'
exports.desc = 'Generate a route template'
// exports.aliases = ''

exports.builder = function (yargs) {
  // yargs.option('option', { default, describe, alias })
  // yargs.commandDir('route')
}

exports.handler = async function (argv) {
  console.log('Start to draw your dream code!')
}
