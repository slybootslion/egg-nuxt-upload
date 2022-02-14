'use strict'

const { Service } = require('egg')
const nodemailer = require('nodemailer')

const userEmail = 'un1gfox@126.com'
const transporter = nodemailer.createTransport({
  service: '126',
  secureConnection: true,
  auth: {
    user: userEmail,
    pass: 'VWAZXMELJHUXISWL',
  },
})

class ToolService extends Service {
  async sendMail (email, subject, text, html) {
    const mailOptions = {
      from: userEmail,
      cc: userEmail,
      to: email,
      subject,
      text,
      html,
    }
    try {
      await transporter.sendMail(mailOptions)
      return true
    } catch (err) {
      console.log('email error:', decodeURI(err.message))
      return false
    }
  }
}

module.exports = ToolService
