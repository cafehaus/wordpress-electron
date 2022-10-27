const fs = require('node:fs')
const path = require('node:path')

/**
 * 读取文件和路径
 * @param path
 * @returns {Promise<any>}
 */
function readFile(path) {
  return new Promise(function(resolve, reject) {
    fs.readdir(path, function(error, result) {
      if (!error) {
        resolve(result)
      } else {
        reject(error)
      }
    })
  })
}

/**
  * 判断目录是否存在
  * @param path
  * @returns {Boolean}
  */
function isDirExist(path) {
  try {
    let stat = fs.lstatSync(path)
    return stat && stat.isDirectory()
  } catch (r) {
    return false
  }
}

/**
  * 复制目录
  * @param sourcePath
  * @param targetPath
  * @returns {Boolean}
  */
function copyDir(sourcePath, targetPath) {
  if (!isDirExist(targetPath)) {
    fs.mkdirSync(targetPath)
  }

  const sourceFile = fs.readdirSync(sourcePath, { withFileTypes: true })
  sourceFile.forEach(file => {
    const newSourcePath = path.resolve(sourcePath, file.name)
    const newTargetPath = path.resolve(targetPath, file.name)
    if (file.isDirectory()) {
      isDirExist(newTargetPath)
      copyDir(newSourcePath, newTargetPath)
    } else {
      fs.copyFileSync(newSourcePath, newTargetPath)
    }
  })
  return true
}

module.exports = {
  readFile,
  isDirExist,
  copyDir,
}
