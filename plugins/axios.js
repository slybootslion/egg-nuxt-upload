import Vue from 'vue'
import axios from 'axios'

const service = axios.create({
  baseURL: '/api',
  timeout: 5000
})

service.interceptors.response.use(
  (response) => {
    const { data } = response

    return data
  }
)

Vue.prototype.$http = service

export const http = service
