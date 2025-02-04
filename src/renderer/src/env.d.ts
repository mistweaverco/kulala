/// <reference types="svelte" />
/// <reference types="vite/client" />
import { ElectronAPI } from '@electron-toolkit/preload'

declare global {
  interface Window {
    electron: ElectronAPI
    KulalaApi: {
      getAppVersion: () => Promise<string>
      pickFiles: (cn: string) => Promise<FileInfo[]>
      getCollectionNames: () => Promise<string[]>
      getFilesByCollectionName: (cn: string) => Promise<DBFilesRow[]>
      getFileContent: (fp: string) => Promise<string>
      removeFileFromCollection: (cn: string, fp: string) => Promise<void>
    }
  }
}
