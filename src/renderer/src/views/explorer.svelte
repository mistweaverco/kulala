<script lang="ts">
  import { onDestroy, onMount } from 'svelte'
  import type * as Monaco from 'monaco-editor/esm/vs/editor/editor.api'
  import { monaco } from './monaco'
  import { getParsedDocument, type ParsedBlock, type ParsedDocument } from '../parser'
  import { useCollections, useFiles } from '../stores'

  let collections = useCollections()
  let files = useFiles()

  let editor: Monaco.editor.IStandaloneCodeEditor
  let editorContainer: HTMLElement

  let activeParsedDocument: ParsedDocument
  let responseEditor: Monaco.editor.IStandaloneCodeEditor
  let responseEditorContainer: HTMLElement
  let responseIsVisible = false
  let pickCollectionModalIsVisible = false

  let pickCollectionDatalist: HTMLDataListElement
  let requestBodyTypeSelect: HTMLSelectElement
  let documentBlocksSelect: HTMLSelectElement
  let tabsList: HTMLUListElement
  let requestMethodSelect: HTMLSelectElement
  let requestUrlInput: HTMLInputElement
  let isLoading = false
  let showInfoModal = false
  let infoModalContent = ''

  let requestMethodSelectValue: string = 'POST'
  let requestUrlInputValue: string = 'https://httpbin.org/post'
  let requestBodyTypeSelectValue: string = 'raw'
  let editorSyntax: string = 'json'
  let pickCollectionValue: string = ''
  let collectionsSelectValue: string = ''

  const onCollectionsChange = (): void => {
    if ($collections.length === 0) {
      return
    }
    pickCollectionDatalist.innerHTML = ''
    $collections.forEach((cn) => {
      const option = document.createElement('option')
      option.value = cn
      pickCollectionDatalist.appendChild(option)
    })
    refreshFiles()
  }

  const refreshFiles = async (): Promise<void> => {
    $files = await window.KulalaApi.getFilesByCollectionName(collectionsSelectValue)
  }

  const onCollectionsSelectChange = async (): Promise<void> => {
    await refreshFiles()
  }

  $: $collections, onCollectionsChange()

  const tabs = [
    { name: 'advanced.http', dir: '/home/marco/projects/personal/kulala.nvim/http-examples' }
  ]

  const onFileMouseenter = (evt): void => {
    evt.target.querySelector('.actions').classList.remove('is-hidden')
  }

  const onFileMouseLeave = (evt): void => {
    evt.target.querySelector('.actions').classList.add('is-hidden')
  }

  const onDocumentBlocksSelectChange = (evt): void => {
    const blockIndex = parseInt(evt.target.value)
    const block = activeParsedDocument.blocks[blockIndex]
    setValuesBasedOnBlock(block)
  }

  const fillDocumentBlocks = (): void => {
    documentBlocksSelect.innerHTML = ''
    activeParsedDocument.blocks.forEach((block, i) => {
      const option = document.createElement('option')
      option.value = i.toString()
      option.textContent = block.name
      documentBlocksSelect.appendChild(option)
    })
  }

  const fillTabs = (): void => {
    tabs.forEach((t, i) => {
      const li = document.createElement('li')
      const anchor = document.createElement('a')
      li.classList.add(i === 0 ? 'is-active' : undefined)
      const leftIcon = document.createElement('span')
      leftIcon.classList.add('icon', 'is-small')
      leftIcon.innerHTML = `<i class="${i === 0 ? 'fas fa-folder' : 'fas fa-paper-plane'}" aria-hidden="true"></i>`
      anchor.appendChild(leftIcon)
      const nameField = document.createElement('span')
      nameField.textContent = t.name
      anchor.addEventListener('click', () => {
        tabsList.querySelectorAll('li').forEach((l) => l.classList.remove('is-active'))
        li.classList.add('is-active')
      })
      anchor.appendChild(nameField)
      li.appendChild(anchor)
      const closeIcon = document.createElement('span')
      closeIcon.title = 'Close tab'
      closeIcon.classList.add('icon', 'is-small', 'is-closer')
      closeIcon.innerHTML = '<i class="fas fa-times"></i>'
      closeIcon.addEventListener('click', (evt) => {
        evt.preventDefault()
        tabsList.removeChild(li)
      })
      anchor.appendChild(closeIcon)
      tabsList.appendChild(li)
    })
  }
  const onCtrlEnterSendRequest = (e: KeyboardEvent): void => {
    if (e.ctrlKey && e.key === 'Enter') {
      sendRequest()
    }
  }

  const onRawSyntaxSelectChange = (evt): void => {
    const selectedValue = evt.target.value
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

  const pickCollection = async (): Promise<void> => {
    pickCollectionModalIsVisible = true
    pickCollectionValue = ''
  }

  const pickFiles = async (): Promise<void> => {
    if (pickCollectionValue === '') {
      return
    }
    pickCollectionModalIsVisible = false
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

    // TODO: Implement missing request body types
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
  const closeInfoModal = (): void => {
    showInfoModal = false
  }
  onMount(async () => {
    $collections = await window.KulalaApi.getCollectionNames()
    fillTabs()
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
  })
  onDestroy(() => {
    monaco?.editor.getModels().forEach((model) => model.dispose())
    editor?.dispose()
  })
  const onFileClick = async (evt: MouseEvent): Promise<void> => {
    const btn = (evt.target as HTMLSpanElement).closest('button') as HTMLButtonElement
    const filePath = btn.dataset.filepath
    const fileContent = await window.KulalaApi.getFileContent(filePath)
    activeParsedDocument = getParsedDocument(fileContent)
    fillDocumentBlocks()
    setValuesBasedOnBlock(activeParsedDocument.blocks[0])
  }
  const onFileRemoveFromCollectionClick = async (evt: MouseEvent): Promise<void> => {
    const btn = (evt.target as HTMLSpanElement).closest('button') as HTMLButtonElement
    const wrapper = btn.closest('.wrapper')
    const collectionName = btn.dataset.collection
    const filePath = btn.dataset.filepath
    await window.KulalaApi.removeFileFromCollection(collectionName, filePath)
    $collections = await window.KulalaApi.getCollectionNames()
    wrapper.remove()
  }
</script>

<div class="modal {isLoading ? 'is-active' : ''}">
  <div class="modal-background"></div>
  <div class="modal-content">
    <progress class="progress is-small is-primary" max="100">15%</progress>
  </div>
</div>

<div class="modal {pickCollectionModalIsVisible ? 'is-active' : ''}">
  <div class="modal-background"></div>
  <div class="modal-card">
    <section class="modal-card-body">
      <div class="content">
        <h1 class="title">Pick a collection</h1>
        <p>Choose a collection to add the file(s) to</p>
        <div class="field">
          <div class="control">
            <div class="select">
              <input
                list="collections"
                class="input"
                name="collection"
                bind:value={pickCollectionValue}
              />
              <datalist id="collections" bind:this={pickCollectionDatalist}></datalist>
            </div>
          </div>
        </div>
      </div>
    </section>
    <footer class="modal-card-foot">
      <div class="buttons">
        <button class="button is-success" on:click={pickFiles}>Pick files</button>
        <button
          class="button is-warning"
          on:click={() => {
            pickCollectionModalIsVisible = false
          }}>Cancel</button
        >
      </div>
    </footer>
  </div>
</div>

<div class="modal {showInfoModal ? 'is-active' : ''}">
  <div class="modal-background"></div>
  <div class="modal-card">
    <section class="modal-card-body">
      <div class="content">
        <h1 class="title">Info</h1>
        <p>{infoModalContent}</p>
      </div>
    </section>
    <footer class="modal-card-foot">
      <div class="buttons">
        <button class="button is-success" on:click={closeInfoModal}>OK</button>
      </div>
    </footer>
  </div>
</div>

<div>
  <table class="kulala-explorer-contents">
    <tbody>
      <tr>
        <td class="kulala-file-explorer">
          <div>
            <div class="field">
              <div class="control">
                <div class="control has-icons-left has-icons-right" style="width: 100%;">
                  <div class="select" style="width: 100%;">
                    <select style="width: 100%;">
                      <option>Development</option>
                    </select>
                  </div>
                  <span class="icon is-small is-left">
                    <i class="fa fa-seedling"></i>
                  </span>
                </div>
              </div>
            </div>

            <div class="field">
              <div class="control">
                <div class="field has-addons">
                  <div class="control has-icons-left has-icons-right">
                    <input placeholder="Search library" class="input" type="text" />
                    <span class="icon is-small is-left">
                      <i class="fa fa-search"></i>
                    </span>
                  </div>
                  <div class="control">
                    <button class="button is-link">
                      <span class="icon">
                        <i class="fa fa-search"></i>
                      </span>
                    </button>
                  </div>
                </div>
              </div>
            </div>

            <hr />

            <div class="field">
              <div class="control">
                <button
                  on:click={pickCollection}
                  class="button is-default"
                  title="Add file(s) to collection"
                >
                  <span class="icon">
                    <i class="fa fa-paper-plane"></i>
                  </span>
                </button>
                <button class="button is-default" title="Rename collection">
                  <span class="icon">
                    <i class="fa-solid fa-truck-moving"></i>
                  </span>
                </button>
                <button class="button is-default" title="Delete collection">
                  <span class="icon">
                    <i class="fa-solid fa-trash-can"></i>
                  </span>
                </button>
              </div>
            </div>

            <div class="field">
              <div class="control">
                <div class="control has-icons-left has-icons-right" style="width: 100%;">
                  <div class="select" style="width: 100%;">
                    <select
                      bind:value={collectionsSelectValue}
                      style="width: 100%;"
                      on:change={onCollectionsSelectChange}
                    >
                      {#each $collections as collectionName}
                        <option value={collectionName}>{collectionName}</option>
                      {/each}
                    </select>
                  </div>
                  <span class="icon is-small is-left">
                    <i class="fa fa-folder"></i>
                  </span>
                </div>
              </div>
            </div>

            <div class="field">
              <div class="control">
                {#each $files as file}
                  <!-- svelte-ignore a11y-no-static-element-interactions -->
                  <div
                    class="wrapper"
                    on:mouseenter={onFileMouseenter}
                    on:mouseleave={onFileMouseLeave}
                  >
                    <button
                      title={file.filepath}
                      class="button is-default"
                      data-filepath={file.filepath}
                      on:click={onFileClick}
                    >
                      <span class="icon-text">
                        <span class="icon">
                          <i class="fas fa-file"></i>
                        </span>
                        <span>{file.name}</span>
                      </span>
                    </button>
                    <span class="actions is-hidden">
                      <button
                        title="Remove from collection"
                        class="button is-default"
                        data-collection={file.collection}
                        data-filepath={file.filepath}
                        on:click={onFileRemoveFromCollectionClick}
                      >
                        <span class="icon">
                          <i class="fa-solid fa-trash-can"></i>
                        </span>
                      </button>
                    </span>
                  </div>
                {/each}
              </div>
            </div>
          </div>
        </td>
        <td>
          <div>
            <div class="tabs is-boxed">
              <ul bind:this={tabsList}></ul>
            </div>

            <div class="field">
              <div class="control">
                <div class="select">
                  <select bind:this={documentBlocksSelect} on:change={onDocumentBlocksSelectChange}>
                    <option>HTTPBIN_EXAMPLE_REQUEST</option>
                    <option>LOGIN_REQUEST</option>
                    <option>FETCH_ARTICLES_REQUEST</option>
                    <option>#4</option>
                    <option>#5</option>
                    <option>#6</option>
                    <option>TOKEN_EXTRACT_REQUEST</option>
                  </select>
                </div>
              </div>
            </div>

            <table class="request-method-and-url">
              <tr>
                <td class="request">
                  <div class="field mr-5">
                    <div class="control">
                      <div class="select">
                        <select
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
                      </div>
                    </div>
                  </div>
                </td>
                <td>
                  <div class="field">
                    <div class="control">
                      <div class="field has-addons">
                        <div class="control url">
                          <input
                            bind:value={requestUrlInputValue}
                            bind:this={requestUrlInput}
                            placeholder="https://httpbin.org/get"
                            class="input"
                            type="url"
                            autocomplete="off"
                            on:keydown={onCtrlEnterSendRequest}
                          />
                        </div>
                        <div class="control">
                          <button class="button is-link" on:click={sendRequest}>
                            <span class="icon">
                              <i class="fa fa-paper-plane"></i>
                            </span>
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </td>
              </tr>
            </table>

            <div class="tabs">
              <ul>
                <!-- svelte-ignore a11y-missing-attribute -->
                <li><a>Headers</a></li>
                <!-- svelte-ignore a11y-missing-attribute -->
                <li class="is-active"><a>Body</a></li>
              </ul>
            </div>

            <div class="field">
              <div class="control">
                <div class="select">
                  <select bind:value={requestBodyTypeSelectValue} bind:this={requestBodyTypeSelect}>
                    <option value="none">none</option>
                    <option value="form-data">form-data</option>
                    <option value="x-www-form-urlencoded">x-www-form-urlencoded</option>
                    <option value="raw">raw</option>
                    <option value="binary">binary</option>
                    <option value="graphql">GraphQL</option>
                  </select>
                </div>
                <div class="select">
                  <select bind:value={editorSyntax} on:change={onRawSyntaxSelectChange}>
                    <option value="text">Text</option>
                    <option value="json">JSON</option>
                    <option value="html">HTML</option>
                    <option value="html">XML</option>
                  </select>
                </div>
              </div>
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
                <div class="editor-wrap {responseIsVisible ? '' : 'is-hidden'}">
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
    width: calc(100% - (var(--bulma-input-radius) * 2));
    height: calc(240px - (var(--bulma-input-radius) * 2));
    padding: var(--bulma-input-radius);
    border: 1px solid #353a46;
    border-radius: var(--bulma-input-radius);
  }
  .editor-container {
    width: calc(100% - (var(--bulma-input-radius) * 2));
    height: calc(240px - (var(--bulma-input-radius) * 4));
  }
  .kulala-explorer-contents {
    width: 100%;
  }
  .kulala-explorer-contents tr td {
    padding: 0;
  }
  .kulala-file-explorer {
    width: 360px;
  }
  .kulala-explorer-contents td.kulala-file-explorer {
    padding-right: 20px;
  }
  .request-method-and-url {
    width: 100%;
  }
  .request-method-and-url .request {
    width: 0;
  }
  .request-method-and-url .url {
    width: 100%;
  }
</style>
