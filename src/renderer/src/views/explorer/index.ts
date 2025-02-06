// utils.ts
import * as monaco from 'monaco-editor'
import type { Writable } from 'svelte/store'
import { getParsedDocument, type ParsedBlock, type ParsedDocument } from '../../parser'

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

const setValuesBasedOnBlock = (
  block: ParsedBlock,
  requestMethodSelect: HTMLSelectElement,
  requestUrlInput: HTMLInputElement,
  editor: monaco.editor.IStandaloneCodeEditor
): void => {
  requestMethodSelect.value = block.method
  requestUrlInput.value = block.url
  editor.setValue(block.body)
}

const fillDocumentBlocks = (
  documentBlocksSelect: HTMLSelectElement,
  activeParsedDocument: ParsedDocument
): void => {
  documentBlocksSelect.innerHTML = ''
  activeParsedDocument.blocks.forEach((block, i) => {
    const option = document.createElement('option')
    option.value = i.toString()
    option.textContent = block.name
    documentBlocksSelect.appendChild(option)
  })
}

export type OnFileClick = (evt: MouseEvent) => Promise<void>

export const createOnFileClick = (
  activeParsedDocument: ParsedDocument,
  documentBlocksSelect: HTMLSelectElement,
  requestMethodSelect: HTMLSelectElement,
  requestUrlInput: HTMLInputElement,
  editor: monaco.editor.IStandaloneCodeEditor
) => {
  return async (evt: MouseEvent): Promise<void> => {
    const btn = (evt.target as HTMLSpanElement).closest('button') as HTMLButtonElement
    const filePath = btn.dataset.filepath
    const fileContent = await window.KulalaApi.getFileContent(filePath)
    activeParsedDocument = getParsedDocument(fileContent)
    fillDocumentBlocks(documentBlocksSelect, activeParsedDocument)
    setValuesBasedOnBlock(
      activeParsedDocument.blocks[0],
      requestMethodSelect,
      requestUrlInput,
      editor
    )
  }
}
