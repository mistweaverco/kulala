import { ipcRenderer } from 'electron'
import { contextBridge } from 'electron'
import { electronAPI } from '@electron-toolkit/preload'

type DBFilesRow = {
  collection: string
  filepath: string
}

type FileInfo = {
  name: string
  fullPath: string
  content: string
}

const KulalaApi = {
  getAppVersion: async (): Promise<string> => {
    return await ipcRenderer.invoke('getAppVersion')
  },
  pickFiles: async (cn: string): Promise<FileInfo[]> => {
    return await ipcRenderer.invoke('pickFiles', cn)
  },
  getCollectionNames: async (): Promise<string[]> => {
    return await ipcRenderer.invoke('getCollectionNames')
  },
  getFilesByCollectionName: async (cn: string): Promise<DBFilesRow[]> => {
    return await ipcRenderer.invoke('getFilesByCollectionName', cn)
  },
  getFileContent: async (fp: string): Promise<string> => {
    return await ipcRenderer.invoke('getFileContent', fp)
  },
  removeFileFromCollection: async (cn: string, fp: string): Promise<void> => {
    await ipcRenderer.invoke('removeFileFromCollection', cn, fp)
  }
}

try {
  contextBridge.exposeInMainWorld('electron', electronAPI)
  contextBridge.exposeInMainWorld('KulalaApi', KulalaApi)
} catch (error) {
  console.error(error)
}
