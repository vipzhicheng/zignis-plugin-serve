const { Utils } = require('zignis')

module.exports = async (ctx, next) => {
  // 默认以 JSON 的方式返回
  ctx.json = true

  // 默认错误码定义
  ctx.errors = {
    1: { msg: '未知错误', status: 500 },
    2: { msg: '错误码无效', status: 400 },
    3: { msg: '参数校验失败', status: 200},
    4: { msg: '路由未定义', status: 400 }
  }

  class Exception extends Error {
    constructor (code, msg, info) {
      let errMsg
      let status
      let errCode = code || 1 // 默认 code = 1
      if (msg || ctx.errors[errCode]) {
        if (Utils._.isString(ctx.errors[errCode]))  {
          errMsg = msg || ctx.errors[errCode] || ''
          status = 200
        } else {
          errMsg = msg || ctx.errors[errCode].msg || ''
          status = ctx.errors[errCode].status || 200
        }
      } else {
        errMsg = '未定义错误'
        status = 500
      }

      super(errMsg)

      this.code = errCode
      this.msg = errMsg
      this.status = status
      this.info = info
    }
  }

  // 默认异常类
  ctx.Exception = Exception

  // 添加自定义错误码
  ctx.error = (code, msg, status = 200) => {
    if (!code || !Utils._.isInteger(code) || !Utils._.isInteger(status)) {
      throw new ctx.Exception(2)
    }

    if (!msg) {
      if (ctx.errors[code]) {
        return ctx.errors[code]
      } else {
        throw new ctx.Exception(1)
      }
    } else {
      if (!Utils._.isString(msg)) {
        throw new ctx.Exception(2)
      }
      ctx.errors[code] = { msg, status }
    }
  }

  try {
    let startTime = new Date()
    ctx.reqId = Utils.day(startTime).format('YYYYMMDD_HHmm_ssSSS') + '_' + Utils._.padStart(Utils._.random(0, 0xffffffff).toString(16), 8, 0)
    await next()
  } catch (e) {
    console.error(e)
    if (e instanceof Exception) { // 有准备的已知错误
      ctx.status = e.status
      ctx.body = {
        reqId: ctx.reqId,
        code: e.code,
        msg: e.msg
      }

      if (e.info) {
        ctx.body.info = e.info
      }
    } else { // 未知错误
      ctx.status = 500
      ctx.body = {
        reqId: ctx.reqId,
        code: 1,
        msg: '未知错误'
      }
    }
    if (process.env.NODE_ENV !== 'production' && e) {
      ctx.body.stack = e.stack // 非线上环境，调用栈返给前端
    }
  }
}