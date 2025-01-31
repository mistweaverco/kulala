import { app, ipcMain } from 'electron'

export const ipcMainHandlersInit = (): void => {
  ipcMain.handle('getAppVersion', (): string => {
    return app.getVersion()
  })
}
