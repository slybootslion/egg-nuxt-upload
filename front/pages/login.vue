<template>
  <div class="login-container">
    <el-form ref="loginForm" label-width="100px" class="login-form" :model="form" :rules="rules">
      <div class="title-container">
        <img src="/logo.png" alt="">
      </div>
      <el-form-item prop="email" label="邮箱">
        <el-input v-model="form.email" placeholder="请输入邮箱" />
      </el-form-item>
      <el-form-item prop="passwd" label="密码">
        <el-input v-model="form.passwd" placeholder="请输入密码" type="password" />
      </el-form-item>
      <el-form-item prop="captcha" label="验证码" class="captcha-container">
        <div class="captcha">
          <img :src="code.captcha" alt="" @click="resetCaptcha">
        </div>
        <el-input v-model="form.captcha" placeholder="请输入验证码" />
      </el-form-item>
      <el-form-item prop="emailcode" label="验证码" class="captcha-container">
        <div class="captcha">
          <el-button type="primary" :disabled="send.timer>0" @click="sendEmailCode">
            {{ sendText }}
          </el-button>
        </div>
        <el-input v-model="form.emailcode" placeholder="请输入邮箱验证码" />
      </el-form-item>
      <el-form-item label="">
        <el-button type="primary" @click.native.prevent="handleLogin">
          登录
        </el-button>
      </el-form-item>
    </el-form>
  </div>
</template>

<script>
import md5 from 'md5'

export default {
  name: 'RegisterPage',
  layout: 'login',
  data () {
    return {
      rules: {
        email: [
          { required: true, message: '请输入邮箱' },
          { type: 'email', message: '输入正确的邮箱格式' }
        ],
        captcha: [
          { required: true, message: '请输入验证码' }
        ],
        emailcode: [
          { required: true, message: '请输入邮箱验证码' }
        ],
        passwd: [
          { required: true, pattern: /^[\w_-]{6,12}$/g, message: '请输入6-12位密码' }
        ]
      },
      form: {
        email: 'slybootslion@vip.qq.com',
        passwd: 'a123456',
        captcha: '',
        emailcode: ''
      },
      model: {},
      code: {
        captcha: '/api/captcha'
      },
      send: {
        timer: 0
      }
    }
  },
  computed: {
    sendText () {
      if (this.send.timer <= 0) {
        return '发送'
      }
      return `${this.send.timer}s后发送`
    }
  },
  methods: {
    handleLogin () {
      this.$refs.loginForm.validate(async (valid) => {
        if (valid) {
          const obj = {
            email: this.form.email,
            passwd: md5(this.form.passwd),
            captcha: this.form.captcha,
            emailcode: this.form.emailcode
          }
          const res = await this.$http.post('/user/login', obj)
          if (res.code === 0) {
            this.$message.success('登录成功')
            localStorage.setItem('token', res.data.token)
            setTimeout(() => {
              this.$router.push('/')
            }, 500)
          } else {
            this.$message.error(res.message)
          }
        }
      })
    },
    resetCaptcha () {
      this.code.captcha = '/api/captcha?' + new Date().getTime()
    },
    async sendEmailCode () {
      await this.$http.get(`/sendcode?email=${this.form.email}`)
      this.send.timer = 10
      this.timer = setInterval(() => {
        this.send.timer -= 1
        if (this.send.timer === 0) {
          clearInterval(this.timer)
        }
      }, 1000)
    }
  }
}
</script>
