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
            // sort by name, case-insensitive
            rows.sort((a, b) => {
              if (a.name.toLowerCase() < b.name.toLowerCase()) {
                return -1
              }
              if (a.name.toLowerCase() > b.name.toLowerCase()) {
                return 1
              }
              return 0
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
          // sort by collection name, case-insensitive
          rows.sort((a, b) => {
            if (a.collection.toLowerCase() < b.collection.toLowerCase()) {
              return -1
            }
            if (a.collection.toLowerCase() > b.collection.toLowerCase()) {
              return 1
            }
            return 0
          })
          const collections = rows.map((row) => row.collection)
          resolve(collections)
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
