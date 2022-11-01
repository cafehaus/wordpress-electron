const fs = require('node:fs')
const path = require('node:path')
const util = require('./util')
const sharp = require('sharp')

// 常量配置
// const appName = '微慕'
const baseColor = '#2f80ed'
const tabImgs = ['tab-cate-on.png', 'tab-index-on.png', 'tab-myself-on.png', 'tab-shop-on.png', 'tab-social-on.png'] // tab 栏图标
// const needDir = ['app.json', 'app.wxss', 'utils', 'images', 'components', 'pages', 'subpages', 'templates'] // 需要处理的目录


/**
  * 生成新的代码目录
  * @param sourcePath
  * @param targetPath
  * @param config
  * @returns {Boolean}
  * 完整目录
  * 'app.js',
  * 'app.json',
  * 'app.wxss',
  * 'components',
  * 'images',
  * 'miniprogram_npm',
  * 'node_modules',
  * 'package-lock.json',
  * 'package.json',
  * 'pages',
  * 'project.config.json',
  * 'project.private.config.json',
  * 'sitemap.json',
  * 'subpages',
  * 'templates',
  * 'utils',
  * 'vendor',
  * 'yarn.lock'
  */
function creatCode(sourcePath, targetPath, config) {
  const configFolder = config.folder // 根目录
  const configName = config.name
  const configColor = config.color
  const configApi = /^(https:\/\/)/.test(config.api) ? config.api : ('https://' + config.api)

  // <el-checkbox label="100">积分商城插件</el-checkbox>
  // <el-checkbox label="101">红包插件</el-checkbox>
  // <el-checkbox label="102">视频号插件</el-checkbox>
  // <!-- <el-checkbox label="103">缓存插件</el-checkbox> -->
  // <el-checkbox label="1">腾讯视频插件 tencentvideo</el-checkbox>
  // <el-checkbox label="2">直播插件 live-player-plugin</el-checkbox>
  // <el-checkbox label="3">小商店插件 mini-shop-plugin</el-checkbox>

  // 插件
  // 积分商城插件 100
  const configPlugin = config.plugin || []
  const needPoints = configPlugin.includes('100')
  // 红包插件 101
  const needRedPacket = configPlugin.includes('101')
  // 视频号插件 102
  const needChannelVideo = configPlugin.includes('102')
  // 腾讯视频插件 1
  const needTencentVideo = configPlugin.includes('1')
  // 直播插件 2
  const needLivePlayer = configPlugin.includes('2')
  // 小商店插件 3
  const needMiniShop = configPlugin.includes('3')


  if (!util.isDirExist(targetPath)) {
    fs.mkdirSync(targetPath)
  }

  // withFileTypes为true，file 才有 name、isDirectory 属性
  const sourceFile = fs.readdirSync(sourcePath, { withFileTypes: true })
  sourceFile.forEach((file) => {
    const fileName = file.name
    const newSourcePath = path.resolve(sourcePath, fileName)
    const newTargetPath = path.resolve(targetPath, fileName)

    if (file.isDirectory()) { // 目录
      // 不需要红包插件
      if (fileName === 'subpages' && !needPoints) {
        return
      }
      if (fileName === 'shop' && !needMiniShop) {
        return
      }

      creatCode(newSourcePath, newTargetPath, config)
    } else {
      if ((path.resolve(configFolder, './app.json') === newSourcePath) && fileName === 'app.json') { // 小程序配置
        let appJson = fs.readFileSync(newSourcePath).toString()
        let newAppJson = {}
        try {
          newAppJson = JSON.parse(appJson)
        } catch (error) {
          console.log(error)
        }
        // let newAppJson = appJson.replaceAll(appName, configName).replaceAll(baseColor, configColor)
        newAppJson?.window?.navigationBarTitleText = configName
        newAppJson?.tabBar?.selectedColor = configColor

        // 处理 pages 页面定义
        let newAppJsonPages = newAppJson.pages || []

        if (!needPoints) {
          if (newAppJson.subpackages) delete newAppJson.subpackages
        }
        if (!needChannelVideo) {
          newAppJsonPages = newAppJsonPages.filter(m => m !== 'pages/channels/channels')
        }
        if (!needTencentVideo) {
          if (newAppJson.plugins && newAppJson.plugins['tencentvideo']) delete newAppJson.plugins['tencentvideo']
        }
        if (!needLivePlayer) {
          if (newAppJson.plugins && newAppJson.plugins['live-player-plugin']) delete newAppJson.plugins['live-player-plugin']
          newAppJsonPages = newAppJsonPages.filter(m => m !== 'pages/live/live')
        }
        if (!needMiniShop) {
          const shopPages = ['pages/shop/index/index', 'pages/shop/order/order', 'pages/shop/order-detail/order-detail', 'pages/shop/my-coupon/my-coupon', 'pages/shop/goods-list/goods-list']
          newAppJsonPages = newAppJsonPages.filter(m => !shopPages.includes(m))
          newAppJson?.tabBar?.list = newAppJson?.tabBar?.list.filter(m => m?.pagePath !== 'pages/shop/index/index')
          if (newAppJson.plugins && newAppJson.plugins['mini-shop-plugin']) delete newAppJson.plugins['mini-shop-plugin']
        }

        newAppJson.pages = newAppJsonPages
        fs.writeFileSync(newTargetPath, JSON.stringify(newAppJson))
      } else if ((path.resolve(configFolder, './utils/config.js') === newSourcePath) && fileName === 'config.js') { // 配置文件
        let configJs = fs.readFileSync(newSourcePath).toString()
        let newConfigJs = configJs.replaceAll('const getDomain = "blog.minapper.com"', `const getDomain = "${configApi}"`)
        fs.writeFileSync(newTargetPath, newConfigJs)
      } else if (/.[wxss|json|wxml|js]$/.test(fileName)) { // 主题色替换
        let wxss = fs.readFileSync(newSourcePath).toString()
        let newWxss = wxss.replaceAll(baseColor, configColor)
        fs.writeFileSync(newTargetPath, newWxss)
      } else if (tabImgs.includes(fileName)) { // tab 图片处理
        sharp(newSourcePath)
          .tint(configColor)
          .toFile(newTargetPath)
      } else {
        fs.copyFileSync(newSourcePath, newTargetPath)
      }
    }
  })
  return 'success'
}

module.exports = {
  creatCode
}