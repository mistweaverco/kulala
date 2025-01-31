/// <reference types="svelte" />
/// <reference types="vite/client" />
import { ElectronAPI } from '@electron-toolkit/preload'

declare global {
  interface Window {
    electron: ElectronAPI
    KulalaApi: {
      getAppVersion: () => Promise<string>
    }
  }
}
