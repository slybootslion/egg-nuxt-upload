'use strict'

const { Service } = require('egg')
const nodemailer = require('nodemailer')
const path = require('path')
const fse = require('fs-extra')

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

  async mergeFile (data) {
    const { filePath, hash, size } = data
    const chunkDir = path.resolve(this.config.UPLOAD_DIR, hash)
    let chunks = await fse.readdir(chunkDir)
    chunks.sort((a, b) => a.split('-')[1] - b.split('-')[1])
    chunks = chunks.map(cp => path.resolve(chunkDir, cp))
    await this.mergeChunks(chunks, filePath, size)
  }

  async mergeChunks (chunks, filePath, size) {
    const pipStream = (filePath, writeStream) => new Promise(resolve => {
      const readStream = fse.createReadStream(filePath)
      readStream.on('end', () => {
        fse.unlinkSync(filePath)
        resolve()
      })
      readStream.pipe(writeStream)
    })

    await Promise.all(
      chunks.map((file, index) => {
        return pipStream(file, fse.createWriteStream(filePath, {
          start: parseInt(index * size),
          end: (index + 1) * size,
        }))
      })
    )
  }
}

module.exports = ToolService
