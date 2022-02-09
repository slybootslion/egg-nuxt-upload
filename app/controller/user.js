'use strict'

const BaseController = require('./base')
const md5 = require('md5')
const jwt = require('jsonwebtoken')

const HashSalt = 'slybOot5li0n@un1gfox'
const createRule = {
  email: { type: 'email' },
  nickname: { type: 'string' },
  passwd: { type: 'string' },
  captcha: { type: 'string' },
}

class UserController extends BaseController {
  async login () {
    const { ctx, app } = this
    const { email, captcha, passwd, emailcode } = ctx.request.body
    if (captcha.toUpperCase() !== ctx.session.captcha.toUpperCase()) return this.error('验证码错误')
    if (emailcode !== ctx.session.emailcode) return this.error('邮箱验证码错误')
    const user = await ctx.model.User.findOne({ email, passwd: md5(passwd + HashSalt) })
    if (!user) return this.error('用户名密码错误')
    const token = jwt.sign({ _id: user._id, email }, app.config.jwt.secret, { expiresIn: '7day' })
    this.success({ token, email, nickname: user.nickname })
  }

  async register () {
    const { ctx } = this
    try {
      ctx.validate(createRule)
    } catch (e) {
      return this.error('参数校验失败', -1, e.errors)
    }
    const { email, captcha, passwd, nickname } = ctx.request.body
    // 验证码
    if (captcha.toUpperCase() !== ctx.session.captcha.toUpperCase()) return this.error('验证码错误')
    if (await this.checkEmail(email)) return this.error('用户名已注册', -1)
    const res = await ctx.model.User.create({
      email, nickname, passwd: md5(passwd + HashSalt),
    })
    if (res._id) this.message('注册成功')
  }

  async checkEmail (email) {
    const user = await this.ctx.model.User.findOne({ email })
    return user
  }

  // 校验用户名是否存在
  async verify () {
    console.log('1')
  }

  async info () {
    const { ctx } = this
    const { email } = ctx.state
    const user = await this.checkEmail(email)
    this.success(user)
  }
}

module.exports = UserController
