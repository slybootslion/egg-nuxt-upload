<script>
export default {
  name: 'UcPage',
  data () {
    return {
      file: null,
      uploadProgress: 0
    }
  },
  async mounted () {
    const res = await this.$http.get('/user/info')
    console.log(res)
    this.bindEvents()
  },
  methods: {
    bindEvents () {
      const drag = this.$refs.drag
      drag.addEventListener('dragover', (e) => {
        drag.style.borderColor = 'red'
        e.preventDefault()
      })
      drag.addEventListener('dragleave', (e) => {
        drag.style.borderColor = '#eee'
        e.preventDefault()
      })
      drag.addEventListener('dragleave', (e) => {
        drag.style.borderColor = '#eee'
        const fileList = e.dataTransfer.files
        this.file = fileList[0]
      })
    },
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
      const res = await this.$http.post('/uploadfile', form, {
        onUploadProgress: (progress) => {
          this.uploadProgress = Number(((progress.loaded / progress.total) * 100).toFixed(2))
        }
      })
      console.log(res)
    }
  }
}
</script>

<template>
  <div>
    <h1>用户中心</h1>
    <div id="drag" ref="drag">
      <input type="file" name="file" @change="handleFileChange">
    </div>
    <div>
      <el-progress :stroke-width="20" :text-inside="true" :percentage="uploadProgress" />
    </div>
    <div>
      <el-button @click="uploadFile">
        上传
      </el-button>
    </div>
  </div>
</template>

<style lang="stylus" scoped>
#drag
  height 100px
  line-height 100px
  border 2px #eee dashed
  text-align center
  vertical-align middle
</style>
