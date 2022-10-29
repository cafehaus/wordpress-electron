const fs = require('node:fs')
const path = require('node:path')
const util = require('./util')
const sharp = require('sharp')

// 常量配置
const appName = '微慕'
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
  const configName = config.name
  const configColor = config.color
  const configApi = /^(https:\/\/)/.test(config.api) ? config.api : ('https://' + config.api)

  if (!util.isDirExist(targetPath)) {
    fs.mkdirSync(targetPath)
  }

  const sourceFile = fs.readdirSync(sourcePath, { withFileTypes: true })
  sourceFile.forEach((file) => {
    const fileName = file.name
    const fileBaseName = file.basename
    console.log(fileName, fileBaseName)
    const newSourcePath = path.resolve(sourcePath, fileName)
    const newTargetPath = path.resolve(targetPath, fileName)

    if (file.isDirectory()) {
      // 目录
      creatCode(newSourcePath, newTargetPath, config)
    } else {
      // 文件：先处理了在复制写入
      if (fileName === 'app.json') { // 小程序配置
        let appJson = fs.readFileSync(newSourcePath).toString()
        let newAppJson = appJson.replaceAll(appName, configName).replaceAll(baseColor, configColor)
        fs.writeFileSync(newTargetPath, newAppJson)
      } else if (fileName === 'config.js') { // 配置文件
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