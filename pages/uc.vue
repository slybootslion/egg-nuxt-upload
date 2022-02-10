<script>
import sparkMD5 from 'spark-md5'

const CHUNK_SIZE = 1024 * 1024
export default {
  name: 'UcPage',
  data () {
    return {
      file: null,
      // uploadProgress: 0,
      hashProgress: 0,
      chunks: []
    }
  },
  computed: {
    cubeWidth () {
      return Math.ceil(Math.sqrt(this.chunks.length)) * 16
    },
    uploadProgress () {
      if (!this.file || this.chunks.length) {
        return 0
      }
      const loaded = this.chunks.map(item => item.chunk.size * item.progress).reduce((acc, cur) => acc + cur, 0)
      return Number(((loaded * 100) / this.file.size).toFixed(2))
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
    async blobToString (blob) {
      return await new Promise((resolve) => {
        const reader = new FileReader()
        reader.onload = function () {
          const res = reader.result.split('')
            .map(v => v.charCodeAt())
            .map(v => v.toString(16).toUpperCase())
            .join(' ')
          resolve(res)
        }
        reader.readAsBinaryString(blob)
      })
    },
    async isGif (file) {
      const res = await this.blobToString(file.slice(0, 6))
      const isGif = (res === '47 49 46 38 39 61') || (res === '47 49 46 38 37 61')
      return isGif
    },
    async isPng (file) {
      const res = await this.blobToString(file.slice(0, 8))
      const isPng = res === '89 59 4E 47 0D 0A 1A 0A'
      return isPng
    },
    async isJpg (file) {
      const start = await this.blobToString(file.slice(0, 2))
      const tail = await this.blobToString(file.slice(-2, file.size))
      const isJpg = (start === 'FF D8') && (tail === 'FF D9')
      return isJpg
    },
    async isImage (file) {
      return await this.isGif(file) || await this.isPng(file) || await this.isJpg(file)
    },
    createFileChunk (file, size = CHUNK_SIZE) {
      const chunks = []
      let cur = 0
      while (cur < this.file.size) {
        chunks.push({
          index: cur,
          file: this.file.slice(cur, cur + size)
        })
        cur += size
      }
      return chunks
    },
    async calculateHashWorker () {
      return await new Promise((resolve) => {
        this.worker = new Worker('/hash.js')
        this.worker.postMessage({ chunks: this.chunks })
        this.worker.onmessage = (e) => {
          const {
            progress,
            hash
          } = e.data
          this.hashProgress = Number(progress.toFixed(2))
          if (hash) {
            resolve(hash)
          }
        }
      })
    },
    async calculateHashIdle () {
      const chunks = this.chunks
      return await new Promise((resolve) => {
        const spark = new sparkMD5.ArrayBuffer()
        let count = 0

        const appendToSpark = async (file) => {
          return await new Promise((resolve) => {
            const reader = new FileReader()
            reader.readAsArrayBuffer(file)
            reader.onload = (e) => {
              spark.append(e.target.result)
              resolve()
            }
          })
        }

        const workLoop = async (deadline) => {
          while (count < chunks.length && deadline.timeRemaining() > 1) {
            await appendToSpark(chunks[count].file)
            count++
            if (count < chunks.length) {
              this.hashProgress = Number(
                ((100 * count) / chunks.length).toFixed(2)
              )
            } else {
              this.hashProgress = 100
              resolve(spark.end())
            }
          }
          window.requestIdleCallback(workLoop)
        }
        window.requestIdleCallback(workLoop)
      })
    },
    async calculateHashSample () {
      return await new Promise((resolve) => {
        const spark = new sparkMD5.ArrayBuffer()
        const reader = new FileReader()
        const file = this.file
        const size = file.size
        const offset = 2 * 1024 * 1024
        const chunks = [file.slice(0, offset)]
        let cur = offset
        while (cur < size) {
          if (cur + offset > size) {
            // 最后一个区块
            chunks.push(file.slice(cur, cur + offset))
          } else {
            const mid = cur + offset / 2
            const end = cur + offset
            chunks.push(file.slice(cur, cur + 2))
            chunks.push(file.slice(mid, mid + 2))
            chunks.push(file.slice(end - 2, end))
          }
          cur += offset
        }
        reader.readAsArrayBuffer(new Blob(chunks))
        reader.onload = (e) => {
          spark.append(e.target.result)
          this.hashProgress = 100
          resolve(spark.end())
        }
      })
    },
    async uploadFile () {
      if (!await this.isImage(this.file)) {
        console.log('文件格式不对')
      } else {
        console.log('文件格式正确')
      }
      const chunks = this.createFileChunk(this.file)
      // const hash = await this.calculateHashWorker()
      // const hash1 = await this.calculateHashIdle()
      const hash2 = await this.calculateHashSample()
      this.hash = hash2
      // console.log('文件hash：', hash)
      // console.log('文件hash1：', hash1)
      // console.log('文件hash2：', hash2)
      // 秒传（询问后端是否上传过，如果有，是否存在切片）
      const {
        data: {
          uploaded,
          uploadedList
        }
      } = await this.$http.post('/checkfile', this.fileUploadData(false))
      if (uploaded) {
        return this.$message.success('秒传成功')
      }
      console.log(uploadedList)

      this.chunks = chunks.map((chunk, index) => {
        const name = `${hash2}-${index}`
        return {
          hash: hash2,
          name,
          index,
          chunk: chunk.file,
          progress: 0
        }
      })
      await this.uploadChunks()
    },
    async uploadChunks () {
      const requests = this.chunks.map((chunk, index) => {
        const form = new FormData()
        form.append('chunk', chunk.chunk)
        form.append('hash', chunk.hash)
        form.append('name', chunk.name)
        form.append('index', chunk.index)
        return form
      }).map((form, index) => this.$http.post('/uploadfile', form, {
        onUploadProgress: (progress) => {
          this.chunks[index].progress = Number(((progress.loaded / progress.total) * 100).toFixed(2))
        }
      }))
      await Promise.all(requests)
      await this.mergeRequest()
      /* const form = new FormData()
        form.append('name', 'file')
        form.append('file', this.file)
        const res = await this.$http.post('/uploadfile', form, {
          onUploadProgress: (progress) => {
            this.uploadProgress = Number(((progress.loaded / progress.total) * 100).toFixed(2))
          }
        })
        console.log(res) */
    },
    async mergeRequest () {
      await this.$http.post('/mergefile', this.fileUploadData())
    },
    fileUploadData (hasSize = true) {
      const data = {
        ext: this.file.name.split('.').pop(),
        hash: this.hash
      }
      if (hasSize) {
        data.size = CHUNK_SIZE
      }
      return data
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
    <div>
      <el-progress :stroke-width="20" :text-inside="true" :percentage="hashProgress" />
    </div>
    <div>
      <div class="cube-container" :style="{width: cubeWidth + 'px'}">
        <div v-for="chunk in chunks" :key="chunk.name" class="cube">
          <div
            :class="{
              'uploading': chunk.progress > 0 && chunk.progress < 100,
              'success': chunk.progress === 100,
              'error': chunk.progress < 0
            }"
            :style="{height: chunk.progress + '%'}"
          />
          <i v-if="chunk.progress < 100 && chunk.progress > 0" class="el-icon-loading" style="color: #f56c6c" />
        </div>
      </div>
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

.cube-container
  .cube
    width 14px
    height: 14px
    line-height: 12px
    border 1px black solid
    background #eee
    float: left

    > .success
      background-color: green

    > .uploading
      background-color: blue

    > .error
      background-color: red
</style>
