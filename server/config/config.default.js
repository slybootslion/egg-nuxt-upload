/* eslint valid-jsdoc: "off" */
'use strict'

const path = require('path')
/**
 * @param {Egg.EggAppInfo} appInfo app info
 */
module.exports = appInfo => {
  /**
   * built-in config
   * @type {Egg.EggAppConfig}
   **/
  const config = exports = {}

  // use for cookie sign key, should change to your own and keep security
  config.keys = appInfo.name + '_1643533892867_8387'

  // add your middleware config here
  config.middleware = []

  config.cluster = {
    listen: {
      port: 40000,
      hostname: '0.0.0.0',
    },
  }

  config.multipart = {
    mode: 'file',
    whitelist: () => true,
  }
  config.UPLODA_DIR = path.resolve(__dirname, '..', 'app/public')

  // add your user config here
  const userConfig = {
    // myAppName: 'egg',
  }


  return {
    ...config,
    ...userConfig,
    security: {
      csrf: {
        enable: false,
      },
    },
    mongoose: {
      client: {
        url: 'mongodb://127.0.0.1:27017/kkbhub',
        options: {},
      },
    },
    jwt: {
      secret: 'slyb0ot5L1@n&un1gFox',
    },
  }
}
