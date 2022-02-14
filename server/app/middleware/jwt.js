'use strict'

const jwt = require('jsonwebtoken')
module.exports = ({ app }) => {
  return async function verify (ctx, next) {
    if (!ctx.request.header.authorization) {
      ctx.body = {
        code: -666,
        message: '用户没有登录',
      }
      return
    }

    const token = ctx.request.header.authorization.replace('Bearer ', '')
    try {
      const res = await jwt.verify(token, app.config.jwt.secret)
      ctx.state.email = res.email
      ctx.state.userid = res._id
      await next()
    } catch (err) {
      if (err.name === 'TokenExpiredError') {
        ctx.body = {
          code: -666,
          message: '用户信息出错',
        }
        return
      }
      console.log(err)
      ctx.body = {
        code: -1,
        message: err.name,
      }
    }
  }
}
