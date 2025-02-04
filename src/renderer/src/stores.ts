import type { Writable } from 'svelte/store'
import { useWritable } from './UseSharedStore'

type FileInCollection = {
  filepath: string
  collection: string
  name: string
}

export const useActiveView = (): Writable<string> => useWritable('activeView', 'explorer')
export const useCollections = (): Writable<string[]> => useWritable('collections', [])
export const useFiles = (): Writable<FileInCollection[]> => useWritable('files', [])
