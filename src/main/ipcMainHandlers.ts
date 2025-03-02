import { app, ipcMain } from 'electron'
import { pickFiles, type FileInfo } from './file'
import { database, type DBFilesRow } from './database'
import fs from 'fs'
import { Document, DocumentParser } from './parser/DocumentParser'

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

  ipcMain.handle('getAppVersion', (): string => {
    return app.getVersion()
  })
}
