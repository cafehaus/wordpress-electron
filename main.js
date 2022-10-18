const { app, BrowserWindow } = require('electron')

const createWindow = () => {
  const win = new BrowserWindow({
    width: 800,
    height: 600,
    // frame: false // 隐藏右上角最大化、最小化、关闭按钮
  })

  win.loadFile('index.html')
  // win.loadFile('./dist/index.html')
  // win.loadURL('http://127.0.0.1:5173/')

  // 隐藏掉顶部菜单
  win.setMenu(null)
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