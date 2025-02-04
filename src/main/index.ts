import { app, shell, BrowserWindow, session } from 'electron'
import { join } from 'path'
import { electronApp, optimizer, is } from '@electron-toolkit/utils'
import icon from '../../resources/icon.png?asset'
import { windowStateKeeper } from './stateKeeper'
import { ipcMainHandlersInit } from './ipcMainHandlers'

let MAIN_WINDOW: BrowserWindow
let SPLASH_WINDOW: BrowserWindow

async function createSplashWindow(): Promise<void> {
  SPLASH_WINDOW = new BrowserWindow({
    width: 400,
    height: 400,
    frame: false,
    transparent: true,
    alwaysOnTop: true,
    resizable: false,
    center: true,
    show: false,
    webPreferences: {
      sandbox: false,
      contextIsolation: true,
      nodeIntegration: true,
      webSecurity: true
    }
  })

  SPLASH_WINDOW.loadFile(join(__dirname, '../splash/index.html'))
  if (is.dev && process.env['ELECTRON_RENDERER_URL']) {
    SPLASH_WINDOW.loadURL(process.env['ELECTRON_RENDERER_URL'] + '/splash.html')
  } else {
    SPLASH_WINDOW.loadFile(join(__dirname, '../renderer/index.html'))
  }

  SPLASH_WINDOW.once('ready-to-show', () => {
    SPLASH_WINDOW.show()
  })
}

async function createMainWindow(): Promise<void> {
  const mainWindowState = await windowStateKeeper('main')

  MAIN_WINDOW = new BrowserWindow({
    width: mainWindowState.width,
    height: mainWindowState.height,
    minWidth: 1024,
    minHeight: 768,
    x: mainWindowState.x,
    y: mainWindowState.y,
    show: false,
    autoHideMenuBar: true,
    ...(process.platform === 'linux' ? { icon } : {}),
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      sandbox: false,
      contextIsolation: true,
      nodeIntegration: true,
      webSecurity: true
    }
  })

  mainWindowState.track(MAIN_WINDOW)

  MAIN_WINDOW.on('ready-to-show', () => {
    MAIN_WINDOW.hide()
    SPLASH_WINDOW.destroy()
    setTimeout(() => {
      MAIN_WINDOW.show()
    }, 1000)
  })

  MAIN_WINDOW.webContents.setWindowOpenHandler((details) => {
    shell.openExternal(details.url)
    return { action: 'deny' }
  })

  if (is.dev && process.env['ELECTRON_RENDERER_URL']) {
    MAIN_WINDOW.loadURL(process.env['ELECTRON_RENDERER_URL'])
  } else {
    MAIN_WINDOW.loadFile(join(__dirname, '../renderer/index.html'))
  }

  if (mainWindowState.isMaximized) {
    MAIN_WINDOW.maximize()
  }
}

app.whenReady().then(async () => {
  electronApp.setAppUserModelId('app.mwco.kulala.desktop')

  app.on('browser-window-created', (_, window) => {
    optimizer.watchWindowShortcuts(window)
  })

  ipcMainHandlersInit()

  await createSplashWindow()
  await createMainWindow()

  // app.on('activate', function () {
  //   if (BrowserWindow.getAllWindows().length === 0) createMainWindow()
  // })
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})
