import { app, ipcMain } from 'electron'
import { pickFiles, type FileInfo } from './file'
import { database, type DBFilesRow } from './database'
import fs from 'fs'
import { Document, DocumentParser } from './parser/DocumentParser'
import { LayoutData, layoutStateKeeper, sessionStateKeeper, SessionState } from './stateKeeper'
import { DocumentBuilder } from './parser/DocumentBuilder'

export const ipcMainHandlersInit = (): void => {
  ipcMain.handle('pickFiles', async (_, cn: string): Promise<FileInfo[]> => {
    const files = await pickFiles()
    await database.addFiles(
      cn,
      files.map((file) => file.fullPath)
    )
    return files
  })

  ipcMain.handle('getFileContent', async (_, fp: string): Promise<string> => {
    return fs.readFileSync(fp, 'utf-8')
  })

  ipcMain.handle('getDocument', async (_, fp: string): Promise<Document | null> => {
    const f = fs.readFileSync(fp, 'utf-8')
    return DocumentParser.parse(f)
  })

  ipcMain.handle('getCollectionNames', async (): Promise<string[]> => {
    return await database.getCollectionNames()
  })

  ipcMain.handle('getFilesByCollectionName', async (_, cn: string): Promise<DBFilesRow[]> => {
    return await database.getFilesByCollectionName(cn)
  })

  ipcMain.handle('removeFileFromCollection', async (_, cn: string, fp: string): Promise<void> => {
    await database.removeFile(cn, fp)
  })

  ipcMain.handle('saveLayout', async (_, layout: { leftSectionWidth: number }): Promise<void> => {
    const lsk = await layoutStateKeeper()
    await lsk.saveState(layout)
  })

  ipcMain.handle('getLayout', async (): Promise<LayoutData> => {
    const lsk = await layoutStateKeeper()
    return await lsk.getLayout()
  })

  ipcMain.handle('saveSession', async (_, s: SessionState): Promise<void> => {
    const sk = await sessionStateKeeper()
    await sk.saveState(s)
  })

  ipcMain.handle('getSession', async (): Promise<SessionState> => {
    const sk = await sessionStateKeeper()
    return await sk.getState()
  })

  ipcMain.handle('saveDocumentModel', async (_, doc: Document, fp: string): Promise<boolean> => {
    const s = await DocumentBuilder.build(doc, true)
    fs.writeFileSync(fp, s, 'utf-8')
    return true
  })

  ipcMain.handle('saveFile', (_, s: string, fp: string): void => {
    fs.writeFileSync(fp, s, 'utf-8')
  })

  ipcMain.handle('getAppVersion', (): string => {
    return app.getVersion()
  })
}
