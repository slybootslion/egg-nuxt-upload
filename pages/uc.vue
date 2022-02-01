<template>
  <div>
    <h1>用户中心</h1>
    <div>
      <input type="file" name="file" @change="handleFileChange">
    </div>
    <div>
      <el-button @click="uploadFile">
        上传
      </el-button>
    </div>
  </div>
</template>

<script>
export default {
  name: 'UcPage',
  data () {
    return {
      file: null
    }
  },
  async mounted () {
    const res = await this.$http.get('/user/info')
    console.log(res)
  },
  methods: {
    handleFileChange (e) {
      const [file] = e.target.files
      if (!file) {
        return
      }
      this.file = file
    },
    async uploadFile () {
      const form = new FormData()
      form.append('name', 'file')
      form.append('file', this.file)
      const res = await this.$http.post('/uploadfile', form)
      console.log(res)
    }
  }
}
</script>

<style scoped>

</style>
