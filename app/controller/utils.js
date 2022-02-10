'use strict'

const svgCaptcha = require('svg-captcha')
const BaseController = require('./base')
const fse = require('fs-extra')
const path = require('path')

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

  async checkfile () {
    const { ctx } = this
    const { ext, hash } = ctx.request.body
    const filePath = path.resolve(this.config.UPLOAD_DIR, `${hash}.${ext}`)
    let uploaded = false
    let uploadedList = []
    if (fse.existsSync(filePath)) {
      // 文件存在
      uploaded = true
    } else {
      uploadedList = await this.getUploadedList(path.resolve(this.config.UPLOAD_DIR), hash)
    }
    this.success({ uploaded, uploadedList })
  }

  async getUploadedList (dirPath) {
    return fse.existsSync(dirPath) ? (await fse.readdir(dirPath)).filter(name => name[0] !== '.') : []
  }

  async uploadfile () {
    const { ctx } = this
    const file = ctx.request.files[0]
    const { name, hash } = ctx.request.body

    this.message('ok')
    const chunkPath = path.resolve(this.config.UPLOAD_DIR, hash)
    if (!fse.existsSync(chunkPath)) {
      await fse.mkdir(chunkPath)
    }

    await fse.move(file.filepath, `${chunkPath}/${name}`)
    this.message('上传成功')
    // this.success({
    //   url: `/public/${file.filename}`,
    // })
  }

  async mergefile () {
    const { ext, size, hash } = this.ctx.request.body
    const filePath = path.resolve(this.config.UPLOAD_DIR, `${hash}.${ext}`)
    await this.ctx.service.tools.mergeFile({ filePath, hash, size })
    this.success({
      url: `/public/${hash}.${ext}`,
    })
  }
}

module.exports = UtilsController
