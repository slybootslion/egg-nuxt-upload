import Vue from 'vue'
import axios from 'axios'

const service = axios.create({
  baseURL: '/api',
  timeout: 5000
})

service.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token')
    if (token) {
      config.headers.common.Authorization = `Bearer ${token}`
    }
    return config
  }
)

service.interceptors.response.use(
  (response) => {
    const { data } = response

    return data
  }
)

Vue.prototype.$http = service

export const http = service
