import { dialog } from 'electron'
import fs from 'fs'

export type FileInfo = {
  name: string
  fullPath: string
  content: string
}

export const pickFiles = async (): Promise<FileInfo[]> => {
  const files: FileInfo[] = []
  const file = await dialog.showOpenDialog({
    properties: ['openFile'],
    filters: [{ name: 'Text', extensions: ['http', 'rest'] }]
  })
  if (file.canceled) {
    return files
  }
  file.filePaths.forEach(async (filePath: string) => {
    const content = fs.readFileSync(filePath, 'utf-8')
    files.push({
      name: filePath.split('/').pop() as string,
      fullPath: filePath,
      content
    })
  })
  return files
}
