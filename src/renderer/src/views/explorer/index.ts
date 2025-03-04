// utils.ts
import * as monaco from 'monaco-editor'
import type { Writable } from 'svelte/store'
import type { Document } from '../../../../main/parser/DocumentParser'

export type OnSyntaxChangeHandler = (evt: Event) => void

export function createOnSyntaxChangeHandler(editor: monaco.editor.IStandaloneCodeEditor) {
  return (evt: Event): void => {
    const target = evt.target as HTMLSelectElement
    const selectedValue = target.value

    switch (selectedValue) {
      case 'json':
        editor.setModel(monaco.editor.createModel(editor.getValue(), 'json'))
        break
      case 'html':
      case 'xml':
        editor.setModel(monaco.editor.createModel(editor.getValue(), 'html'))
        break
      case 'text':
      default:
        editor.setModel(monaco.editor.createModel(editor.getValue(), 'text'))
        break
    }
  }
}

export type OnFileRemoveFromCollectionClick = (evt: MouseEvent) => Promise<void>

export const createOnFileRemoveFromCollectionClick = (collections: Writable<string[]>) => {
  return async (evt: MouseEvent): Promise<void> => {
    const btn = (evt.target as HTMLSpanElement).closest('button') as HTMLButtonElement
    const wrapper = btn.closest('.wrapper')
    const collectionName = btn.dataset.collection
    const filePath = btn.dataset.filepath
    await window.KulalaApi.removeFileFromCollection(collectionName, filePath)
    const updatedCollection = await window.KulalaApi.getCollectionNames()
    collections.set(updatedCollection)
    wrapper.remove()
  }
}

export const getActiveParsedDocument = async (filepath: string): Promise<Document> => {
  return await window.KulalaApi.getDocument(filepath)
}
