<script lang="ts">
  import { onDestroy, onMount } from 'svelte'
  import type * as Monaco from 'monaco-editor/esm/vs/editor/editor.api'
  import { monaco } from './monaco'
  import { type ParsedBlock, type ParsedDocument } from '../parser'
  import { useCollections, useFiles } from '../stores'
  import type { OnSyntaxChangeHandler } from './explorer'
  import { createOnSyntaxChangeHandler, getActiveParsedDocument } from './explorer'
  import { NewResizer } from './explorer/resizer'

  let collections = useCollections()
  let files = useFiles()

  let editor: Monaco.editor.IStandaloneCodeEditor
  let editorContainer: HTMLElement

  let activeParsedDocument: ParsedDocument
  let responseEditor: Monaco.editor.IStandaloneCodeEditor
  let responseEditorContainer: HTMLElement
  let responseIsVisible = false

  let loadingModal: HTMLDialogElement
  let addFilesModal: HTMLDialogElement
  let removeFileModal: HTMLDialogElement
  let pickCollectionDatalist: HTMLDataListElement
  let requestBodyTypeSelect: HTMLSelectElement
  let requestMethodSelect: HTMLSelectElement
  let requestUrlInput: HTMLInputElement
  let containerLeftSection: HTMLElement

  let isLoading = false

  let requestMethodSelectValue: string = 'GET'
  let requestUrlInputValue: string = ''
  let requestBodyTypeSelectValue: string = 'raw'
  let editorSyntax: string = 'json'
  let pickCollectionValue: string = ''
  let collectionsSelectValue: string = ''
  let selectedFile = {
    name: '',
    filepath: ''
  }

  let selectedRequest = {
    name: '',
    block: null
  }

  const refreshFiles = async (): Promise<void> => {
    $files = await window.KulalaApi.getFilesByCollectionName(collectionsSelectValue)
  }

  const onCollectionsSelectChange = async (evt: Event): Promise<void> => {
    const target = evt.target as HTMLInputElement
    collectionsSelectValue = target.value
    refreshFiles()
  }

  const onCtrlEnterSendRequest = (e: KeyboardEvent): void => {
    if (e.ctrlKey && e.key === 'Enter') {
      sendRequest()
    }
  }

  const toggleRemoveFileModal = (): void => {
    if (removeFileModal.open) {
      removeFileModal.close()
    } else {
      removeFileModal.showModal()
    }
  }

  const togglePickCollectionModal = (): void => {
    if (addFilesModal.open) {
      addFilesModal.close()
    } else {
      addFilesModal.showModal()
    }
  }

  const pickCollection = async (): Promise<void> => {
    togglePickCollectionModal()
    pickCollectionValue = ''
  }

  const onCollectionsChange = (): void => {
    if (pickCollectionDatalist) pickCollectionDatalist.innerHTML = ''
    collectionsSelectValue = ''
    if ($collections.length === 0) {
      return
    }
    $collections.forEach((cn) => {
      const option = document.createElement('option')
      option.value = cn
      pickCollectionDatalist.appendChild(option)
    })
  }

  const pickFiles = async (): Promise<void> => {
    if (pickCollectionValue === '') {
      return
    }
    togglePickCollectionModal()
    const files = await window.KulalaApi.pickFiles(pickCollectionValue)
    if (files.length === 0) {
      return
    }
    $collections = await window.KulalaApi.getCollectionNames()
  }

  const setValuesBasedOnBlock = (block: ParsedBlock): void => {
    requestMethodSelect.value = block.method
    requestUrlInput.value = block.url
    editor.setValue(block.body)
  }

  let abortController: AbortController

  const clearResponse = (): void => {
    responseIsVisible = false
    responseEditor.setValue('')
  }

  const processResponse = (data: string): void => {
    const trimmedData = data.trim()
    if (trimmedData.startsWith('{') || trimmedData.startsWith('[')) {
      try {
        const parsedData = JSON.parse(trimmedData)
        responseEditor.setModel(
          monaco.editor.createModel(JSON.stringify(parsedData, null, 2), 'json')
        )
      } catch (err) {
        responseEditor.setModel(monaco.editor.createModel(data, 'text'))
      }
    } else if (trimmedData.startsWith('<')) {
      responseEditor.setModel(monaco.editor.createModel(data, 'html'))
    } else {
      responseEditor.setModel(monaco.editor.createModel(data, 'text'))
    }
    responseIsVisible = true
    setTimeout(() => {
      responseEditor.layout()
    }, 500)
  }

  const getRequestBody = (): string => {
    const canHaveBody = ['POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS', 'TRACE', 'CONNECT'].includes(
      requestMethodSelect.value
    )
    if (!canHaveBody) {
      return undefined
    }

    switch (requestBodyTypeSelect.value) {
      case 'form-data':
        return editor.getValue()
      case 'x-www-form-urlencoded':
        return undefined
      case 'raw':
        return editor.getValue()
      case 'binary':
        return undefined
      case 'GraphQL':
        return undefined
      case 'none':
      default:
        return undefined
    }
  }

  const sendRequest = (): void => {
    clearResponse()
    isLoading = true
    abortController = new AbortController()
    fetch(requestUrlInput.value, {
      method: requestMethodSelect.value,
      headers: {
        'Content-Type': 'application/json'
      },
      body: getRequestBody(),
      signal: abortController.signal
    })
      .then((res) => res.text())
      .then((data) => {
        processResponse(data)
      })
      .catch((err) => {
        showInfoModal = true
        infoModalContent = err
      })
      .finally(() => {
        isLoading = false
      })
  }

  const abortRequest = (): void => {
    abortController.abort('Request aborted by user')
  }
  const onDocumentKeyDown = (e: KeyboardEvent): void => {
    if (isLoading && e.key === 'Escape') {
      abortRequest()
    }
  }
  onMount(async () => {
    $collections = await window.KulalaApi.getCollectionNames()
    document.addEventListener('keydown', onDocumentKeyDown)

    editor = monaco.editor.create(editorContainer, {})
    editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.Enter, function () {
      sendRequest()
    })
    editor.setModel(monaco.editor.createModel('{}', 'json'))
    responseEditor = monaco.editor.create(responseEditorContainer, {
      readOnly: true
    })
    responseEditor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.Enter, function () {
      sendRequest()
    })
    responseEditor.setModel(monaco.editor.createModel('', 'text'))

    window.addEventListener('resize', () => {
      editor.layout()
      responseEditor.layout()
    })
    NewResizer(containerLeftSection, true, false)
  })
  onDestroy(() => {
    monaco?.editor.getModels().forEach((model) => model.dispose())
    editor?.dispose()
  })

  let onRawSyntaxSelectChange: OnSyntaxChangeHandler

  const onRequestClick = (evt: MouseEvent): void => {
    const target = evt.target as HTMLButtonElement
    const idx = parseInt(target.dataset.idx, 10)
    const block = activeParsedDocument.blocks[idx]
    if (block) {
      setValuesBasedOnBlock(block)
      selectedRequest.name = block.name
      selectedRequest.block = block
    }
  }

  const removeFileFromCollection = async (): Promise<void> => {
    await window.KulalaApi.removeFileFromCollection(collectionsSelectValue, selectedFile.filepath)
    await refreshFiles()
    $collections = await window.KulalaApi.getCollectionNames()
    toggleRemoveFileModal()
  }

  const onFileClick = async (evt: MouseEvent): Promise<void> => {
    const target = evt.target as HTMLInputElement
    const filename = target.dataset.filename
    const filepath = target.dataset.filepath
    selectedFile.name = filename
    selectedFile.filepath = filepath
    activeParsedDocument = await getActiveParsedDocument(filepath)
  }
  $: if (loadingModal) isLoading ? loadingModal.showModal() : loadingModal.close()
  $: if (editor) {
    onRawSyntaxSelectChange = createOnSyntaxChangeHandler(editor)
  }
  $: $collections, onCollectionsChange()
</script>

<dialog class="modal" bind:this={loadingModal}>
  <div class="modal-box w-fit">
    <span class="loading loading-xl loading-spinner text-secondary"></span>
  </div>
</dialog>

<dialog class="modal" bind:this={addFilesModal}>
  <div class="modal-box">
    <h1 class="title">Pick a collection</h1>
    <p>Choose a collection to add the file(s) to</p>
    <input
      list="collections"
      class="input mb-5 mt-5"
      name="collection"
      bind:value={pickCollectionValue}
    />
    <datalist id="collections" bind:this={pickCollectionDatalist}></datalist>
    <footer class="modal-card-foot">
      <div class="buttons">
        <button class="btn btn-success">
          <span class="icon">
            <i class="fa fa-plus"></i>
          </span>
          Create a file
        </button>
        <button class="btn btn-success" on:click={pickFiles}>
          <span class="icon">
            <i class="fa fa-plus"></i>
          </span>
          Pick existing files
        </button>
        <button class="btn btn-warning" on:click={togglePickCollectionModal}>
          <span class="icon">
            <i class="fa fa-times"></i>
          </span>
          Cancel
        </button>
      </div>
    </footer>
  </div>
</dialog>

<dialog class="modal" bind:this={removeFileModal}>
  <div class="modal-box">
    <h1 class="title">Delete or remove a file</h1>
    <p>You have {selectedFile.name} selected.</p>
    <footer class="modal-card-foot">
      <div class="buttons">
        <button on:click={removeFileFromCollection} class="btn btn-warning">
          <span class="icon"> <i class="fa fa-trash"> </i></span>
          Remove from collection
        </button>
        <button class="btn btn-error">
          <span class="icon"> <i class="fa fa-trash"> </i></span>
          Delete from disk
        </button>
        <button class="btn btn-success" on:click={toggleRemoveFileModal}>
          <span class="icon">
            <i class="fa fa-times"></i>
          </span>
          Cancel
        </button>
      </div>
    </footer>
  </div>
</dialog>

<div>
  <table class="kulala-explorer-contents">
    <tbody>
      <tr>
        <td
          bind:this={containerLeftSection}
          class="kulala-file-explorer ui-resizable ui-resizable-width"
        >
          <div>
            <div class="text-right mb-5 mt-5">
              <button
                on:click={pickCollection}
                class="btn btn-xs btn-success"
                title="Add file(s) to collection"
              >
                <span class="icon">
                  <i class="fa fa-plus"></i>
                </span>
              </button>
            </div>

            <div class="field">
              {#each $collections as collectionName}
                <div class="collapse collapse-arrow bg-base-100 border border-base-300">
                  <input
                    type="radio"
                    name="collection-accordion-1"
                    value={collectionName}
                    checked={collectionsSelectValue === collectionName ? true : false}
                    on:change={onCollectionsSelectChange}
                  />
                  <div class="collapse-title font-semibold">
                    <span>{collectionName}</span>
                  </div>
                  <div class="collapse-content text-sm">
                    {#if collectionsSelectValue === collectionName}
                      <div class="mb-5">
                        <button title="Rename this collection" class="btn btn-xs btn-warning">
                          <span class="icon">
                            <i class="fa fa-pencil"></i>
                          </span>
                        </button>
                        <button title="Remove this collection" class="btn btn-xs btn-error">
                          <span class="icon">
                            <i class="fa fa-trash"></i>
                          </span>
                        </button>
                      </div>
                    {/if}
                    {#each $files as file}
                      <div class="collapse collapse-arrow bg-base-100 border border-base-300">
                        <input
                          type="radio"
                          name="collection-file-accordion-1"
                          data-filename={file.name}
                          data-filepath={file.filepath}
                          on:click={onFileClick}
                        />
                        <div class="collapse-title font-semibold">
                          <span>{file.name}</span>
                        </div>
                        <div class="collapse-content text-sm">
                          {#if file.filepath === selectedFile.filepath}
                            <div class="mb-5">
                              <button
                                class="btn btn-xs btn-success"
                                title="Add a request to this file"
                              >
                                <span class="icon">
                                  <i class="fa fa-plus"></i>
                                </span>
                              </button>
                              <button title="Rename this file" class="btn btn-xs btn-warning">
                                <span class="icon">
                                  <i class="fa fa-pencil"></i>
                                </span>
                              </button>
                              <button
                                title="Remove this file"
                                on:click={toggleRemoveFileModal}
                                class="btn btn-xs btn-error"
                              >
                                <span class="icon">
                                  <i class="fa fa-trash"></i>
                                </span>
                              </button>
                              <button
                                class="btn btn-xs btn-info"
                                title="Run all requests in this file"
                              >
                                <span class="icon">
                                  <i class="fa fa-play"></i>
                                </span>
                              </button>
                            </div>
                          {/if}
                          <ul class="list bg-base-100 rounded-box shadow-md">
                            {#if activeParsedDocument}
                              {#each activeParsedDocument.blocks as block, idx}
                                <li class="list-row">
                                  <div class="list-col">
                                    <span class="icon">
                                      <i class="fa-solid fa-grip-lines"></i>
                                    </span>
                                  </div>
                                  <div class="list-col-grow">
                                    <button
                                      class="cursor-pointer w-full"
                                      data-idx={idx}
                                      on:click={onRequestClick}>{block.name}</button
                                    >
                                  </div>
                                </li>
                              {/each}
                            {/if}
                          </ul>
                        </div>
                      </div>
                    {/each}
                  </div>
                </div>
              {/each}
            </div>
          </div>
        </td>
        <td valign="top">
          <div>
            {#if selectedRequest.block}
              <div class="stats shadow">
                <div class="stat">
                  <div class="stat-figure text-primary">
                    <span class="icon">
                      <i class="fa fa-file"></i>
                    </span>
                  </div>
                  <div class="stat-title">Current file</div>
                  <div class="stat-value text-primary">{selectedFile.name}</div>
                  <div class="stat-desc">{selectedFile.filepath}</div>
                </div>

                <div class="stat border-r border-dashed border-r-gray-700">
                  <div class="stat-figure text-secondary">
                    <span class="icon">
                      <i class="fa fa-eye"></i>
                    </span>
                  </div>
                  <div class="stat-title">Current request</div>
                  <div class="stat-value text-secondary">{selectedRequest.name}</div>
                  <div class="stat-desc">{selectedRequest.name}</div>
                </div>
              </div>
              <div class="stats shadow">
                <div class="stat">
                  <div class="stat-figure text-success">
                    <span class="icon">
                      <i class="fa fa-check"></i>
                    </span>
                  </div>
                  <div class="stat-title">Requests count</div>
                  <div class="stat-value text-success">{activeParsedDocument.blocks.length}</div>
                  <div class="stat-desc">Total requests in this file</div>
                </div>
                <div class="stat">
                  <div class="stat-figure text-warning">
                    <span class="icon">
                      <i class="fa fa-leaf"></i>
                    </span>
                  </div>
                  <div class="stat-title">Environment</div>
                  <div class="stat-value text-warning">Staging</div>
                  <div class="stat-desc">Your selected environment</div>
                </div>
              </div>
            {/if}
            <div class="join w-full">
              <select
                class="join-item select w-fit"
                bind:value={requestMethodSelectValue}
                bind:this={requestMethodSelect}
              >
                <option value="GET">GET</option>
                <option value="POST">POST</option>
                <option value="PUT">PUT</option>
                <option value="DELETE">DELETE</option>
                <option value="OPTIONS">OPTIONS</option>
                <option value="HEAD">HEAD</option>
                <option value="TRACE">TRACE</option>
                <option value="CONNECT">CONNECT</option>
              </select>
              <input
                bind:value={requestUrlInputValue}
                bind:this={requestUrlInput}
                placeholder="https://httpbin.org/get"
                class="join-item input w-full"
                type="url"
                autocomplete="off"
                spellcheck="false"
                on:keydown={onCtrlEnterSendRequest}
              />
              <button class="join-item btn btn-primary" on:click={sendRequest}>
                <span class="icon">
                  <i class="fa fa-paper-plane"></i>
                </span>
              </button>
            </div>
            <div role="tablist" class="tabs tabs-lift mb-5 mt-5">
              <button role="tab" class="tab">Headers</button>
              <button role="tab" class="tab tab-active">Body</button>
            </div>

            <div class="join">
              <select
                class="join-item select w-fit"
                bind:value={requestBodyTypeSelectValue}
                bind:this={requestBodyTypeSelect}
              >
                <option value="none">none</option>
                <option value="form-data">form-data</option>
                <option value="x-www-form-urlencoded">x-www-form-urlencoded</option>
                <option value="raw">raw</option>
                <option value="binary">binary</option>
                <option value="graphql">GraphQL</option>
              </select>
              <select
                class="join-item select w-fit"
                bind:value={editorSyntax}
                on:change={onRawSyntaxSelectChange}
              >
                <option value="text">Text</option>
                <option value="json">JSON</option>
                <option value="html">HTML</option>
                <option value="html">XML</option>
              </select>
            </div>

            <div class="field mt-5">
              <div class="control">
                <div>
                  <div class="editor-wrap">
                    <div class="editor-container" bind:this={editorContainer} />
                  </div>
                </div>
              </div>
            </div>

            <div class="field mt-5">
              <div class="control">
                <div class="editor-wrap {responseIsVisible ? '' : 'hidden'}">
                  <div class="editor-container" bind:this={responseEditorContainer} />
                </div>
              </div>
            </div>
          </div>
        </td>
      </tr>
    </tbody>
  </table>
</div>

<style>
  .editor-wrap {
    width: calc(100% - 8px);
    height: calc(240px - 8px);
    padding: 4px;
    border: 1px solid #353a46;
    border-radius: 4px;
  }
  .editor-container {
    width: calc(100% - 8px);
    height: calc(240px - 8px);
  }
  .kulala-explorer-contents {
    width: 100%;
  }
  .kulala-explorer-contents tr td {
    padding: 0;
  }
  .kulala-file-explorer {
    width: 360px;
    vertical-align: top;
  }
  .kulala-explorer-contents td.kulala-file-explorer {
    padding-right: 20px;
  }
</style>
