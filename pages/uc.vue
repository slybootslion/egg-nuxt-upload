<template>
  <div>
    uc
  </div>
</template>

<script>
export default {
  name: 'UcPage',
  async mounted () {
    const res = await this.$http.get('/user/info')
    console.log(res)
  }
}
</script>

<style scoped>

</style>
