import { app } from 'electron'
import sqlite3 from 'sqlite3'
import path from 'path'
import fs from 'fs'

const userDataPath = path.join(app.getPath('userData'), '..', 'kulala')
const dbPath = path.join(userDataPath, 'kulala.db')

const db = new sqlite3.Database(dbPath)

if (!fs.existsSync(userDataPath)) {
  fs.mkdirSync(userDataPath)
}

export type DBFilesRow = {
  collection: string
  filepath: string
  name: string
}

const database = {
  init: (): void => {
    db.serialize(() => {
      db.run(
        'CREATE TABLE IF NOT EXISTS files (collection TEXT NOT NULL, filepath TEXT NOT NULL, UNIQUE(collection, filepath));'
      )
    })
  },
  getFilesByCollectionName: (collection: string): Promise<DBFilesRow[]> => {
    return new Promise((resolve, reject) => {
      db.all(
        'SELECT * FROM files WHERE collection = ?',
        [collection],
        (err, rows: DBFilesRow[]) => {
          if (err) {
            reject(err)
          } else {
            rows.forEach((row) => {
              row.name = path.basename(row.filepath)
            })
            resolve(rows)
          }
        }
      )
    })
  },
  getCollectionNames: (): Promise<string[]> => {
    return new Promise((resolve, reject) => {
      db.all('SELECT DISTINCT collection FROM files', (err, rows: { collection: string }[]) => {
        if (err) {
          reject(err)
        } else {
          resolve(rows.map((row) => row.collection))
        }
      })
    })
  },
  removeFile: (collection: string, filepath: string): Promise<Error | null> => {
    return new Promise((resolve, reject) => {
      db.run(
        'DELETE FROM files WHERE collection = ? AND filepath = ?',
        [collection, filepath],
        (err) => {
          if (err) {
            reject(err)
          } else {
            resolve(null)
          }
        }
      )
    })
  },
  addFiles: (collection: string, filepaths: string[]): Promise<Error | null> => {
    return new Promise((resolve, reject) => {
      const stmt = db.prepare('INSERT INTO files (collection, filepath) VALUES (?, ?)')
      filepaths.forEach((filepath) => {
        stmt.run(collection, filepath)
      })
      stmt.finalize((err) => {
        if (err) {
          reject(err)
        } else {
          resolve(null)
        }
      })
    })
  }
}

database.init()

export { database }
