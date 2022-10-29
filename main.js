const { app, BrowserWindow, ipcMain, dialog } = require('electron')
const fs = require('node:fs')
const path = require('node:path')
const util = require('./libs/util')
const weixin = require('./libs/weixin')

const createWindow = () => {
  const win = new BrowserWindow({
    width: 800,
    height: 600,
    webPreferences: {
      nodeIntegration: true, // 使渲染进程拥有node环境
      contextIsolation: false, // 设置此项为false后，才可在渲染进程中使用 electron api，https://www.electronjs.org/zh/docs/latest/api/browser-window
      preload: path.join(__dirname, 'preload.js')
    }
    // frame: false // 隐藏右上角最大化、最小化、关闭按钮(如果还隐藏了顶部菜单，窗口会不能拖动了，需要在html里用样式来实现窗口拖动)
  })

  // win.loadFile('index.html')
  // win.loadFile('./dist/index.html')
  win.loadURL('http://127.0.0.1:5173/')

  // 隐藏掉顶部菜单
  win.setMenu(null)

  // 启用开发工具
  win.webContents.openDevTools()
}

app.whenReady().then(() => {
  createWindow()

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow()
    }
  })
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

// 用 handle 可以实现双向通信，send 和 on 只能触发一方的(收到再回复需要用 event.reply 给对方发送另一个事件)
// 主进程 ipcMain.handle 渲染进程 ipcRenderer.invoke

// 选择目录
ipcMain.handle('selectFolder', async (event, data)=> {
  const filePaths = dialog.showOpenDialogSync({
    title: '选择目录',
    properties: ["openDirectory", "createDirectory"],
  })

  return filePaths?.[0] || ''
})

// 生成代码
ipcMain.handle('creatCode', async (event, data)=> {
  const folder = data.folder
  if (!folder || (folder && !util.isDirExist(folder))) {
    title: '提示',
    dialog.showMessageBoxSync({
      message: '目录不存在',
      type: 'error',
    })
  }

  // 生成新的代码
  const folderCopy = folder + '_BAK'
  if (!util.isDirExist(folderCopy)) {
    fs.mkdirSync(folderCopy)
  } else {
    util.deleteFile(folderCopy, () => { fs.mkdirSync(folderCopy) })
  }

  const codeRes = weixin.creatCode(folder, folderCopy, data)
  if (codeRes !== 'success') {
    return '生成失败，请重试'
  }

  // 保存到新的目录
  const saveRes = dialog.showSaveDialogSync({
    title: '保存文件',
    properties: ["createDirectory"],
    // defaultPath: folderCopy
  })
  console.log(saveRes)
  if (saveRes === undefined) {
    return 'cancel'
  } else {
    const copyRes = util.copyDir(folderCopy, saveRes)
    if (copyRes) {
      // 删掉源文件
      util.deleteFile(folderCopy)
      return 'success'
    } else {
      return 'error'
    }
  }

  // .then(r => {
  //   console.log(r)
  //   if (r && r.canceled) {
  //     return 'cancel'
  //   }
  //   const copyRes = util.copyDir(folderCopy, r.filePath)
  //   if (copyRes) {
  //     // 删掉源文件
  //     util.deleteFile(folderCopy)
  //     return 'success'
  //   }
  // }).catch(err => {
  //   console.log(err)
  //   return err
  // })
})