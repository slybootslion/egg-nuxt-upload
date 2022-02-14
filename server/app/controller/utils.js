'use strict'

const svgCaptcha = require('svg-captcha')
const BaseController = require('./base')
const fse = require('fs-extra')

class UtilsController extends BaseController {
  async captcha () {
    const captcha = svgCaptcha.create({
      size: 4,
      fontSize: 50,
      width: 100,
      height: 40,
      noise: 3,
    })
    console.log('captcha->', captcha.text)
    this.ctx.session.captcha = captcha.text
    this.ctx.response.type = 'image/svg+xml'
    this.ctx.body = captcha.data
  }

  async sendcode () {
    const { ctx } = this
    const email = ctx.query.email
    const code = Math.random().toString().slice(2, 6)
    console.log(`email-> ${email}, code-> ${code}`)
    ctx.session.emailcode = code
    const subject = '验证码'
    const text = ''
    const html = `<h2>这是一封邮件验证码</h2><a href="http://localhost:40000"><span>${code}</span></a>`
    const hasSend = await this.service.tools.sendMail(email, subject, text, html)
    hasSend ? this.message('发送成功') : this.error('发送失败')
  }

  async uplodafile () {
    const { ctx } = this
    const file = ctx.request.files[0]
    // const { name } = ctx.request.body
    await fse.move(file.filepath, `${this.config.UPLODA_DIR}/${file.filename}`)
    this.success({
      url: `/public/${file.filename}`,
    })
  }
}

module.exports = UtilsController
