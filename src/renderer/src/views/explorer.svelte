<script lang="ts">
  import { onDestroy, onMount } from 'svelte'
  import type * as Monaco from 'monaco-editor/esm/vs/editor/editor.api'
  import { monaco } from './monaco'

  let editor: Monaco.editor.IStandaloneCodeEditor
  let editorContainer: HTMLElement

  let responseEditor: Monaco.editor.IStandaloneCodeEditor
  let responseEditorContainer: HTMLElement

  let requestBodyTypeSelect: HTMLSelectElement
  let tabsList: HTMLUListElement
  let requestMethodSelect: HTMLSelectElement
  let requestUrlInput: HTMLInputElement
  let isLoading = false
  let showInfoModal = false
  let infoModalContent = ''

  const files = [
    { name: 'advanced.http', dir: '/home/marco/projects/personal/kulala.nvim/http-examples' }
  ]
  const tabs = [
    { name: 'advanced.http', dir: '/home/marco/projects/personal/kulala.nvim/http-examples' }
  ]
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

  let abortController: AbortController

  const clearResponse = (): void => {
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
    fillTabs()
    document.addEventListener('keydown', onDocumentKeyDown)

    editor = monaco.editor.create(editorContainer)
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
  })
  onDestroy(() => {
    monaco?.editor.getModels().forEach((model) => model.dispose())
    editor?.dispose()
  })
</script>

<div class="modal {isLoading ? 'is-active' : ''}">
  <div class="modal-background"></div>
  <div class="modal-content">
    <progress class="progress is-small is-primary" max="100">15%</progress>
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
                <button class="button is-link" title="Add collection">
                  <span class="icon">
                    <i class="fa fa-folder"></i>
                  </span>
                </button>
                <button class="button is-link" title="Add file(s) to collection">
                  <span class="icon">
                    <i class="fa fa-paper-plane"></i>
                  </span>
                </button>
              </div>
            </div>

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

            <nav class="breadcrumb" aria-label="breadcrumbs">
              <ul>
                <li>
                  <a href="#breadcrumb">
                    <span class="icon is-small">
                      <i class="fas fa-home" aria-hidden="true"></i>
                    </span>
                    <span>Root</span>
                  </a>
                </li>
                <li>
                  <a href="#breadcrumb">
                    <span class="icon is-small">
                      <i class="fas fa-folder" aria-hidden="true"></i>
                    </span>
                    <span>Kulala</span>
                  </a>
                </li>
                <li>
                  <a href="#breadcrumb">
                    <span class="icon is-small">
                      <i class="fas fa-folder" aria-hidden="true"></i>
                    </span>
                    <span>Test-Requests</span>
                  </a>
                </li>
              </ul>
            </nav>

            <table class="table">
              <tbody>
                {#each files as file}
                  <tr>
                    <td>{file.name}</td>
                  </tr>
                {/each}
              </tbody>
            </table>
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
                  <select>
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
                        <select bind:this={requestMethodSelect}>
                          <option value="GET">GET</option>
                          <option value="POST" selected>POST</option>
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
                            bind:this={requestUrlInput}
                            placeholder="https://httpbin.org/get"
                            class="input"
                            type="url"
                            value="https://httpbin.org/post"
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
                  <select bind:this={requestBodyTypeSelect}>
                    <option>none</option>
                    <option>form-data</option>
                    <option>x-www-form-urlencoded</option>
                    <option selected>raw</option>
                    <option>binary</option>
                    <option>GraphQL</option>
                  </select>
                </div>
                <div class="select">
                  <select on:change={onRawSyntaxSelectChange}>
                    <option value="text">Text</option>
                    <option value="json" selected>JSON</option>
                    <option value="html">HTML</option>
                    <option value="html">XML</option>
                  </select>
                </div>
              </div>
            </div>

            <div class="field mt-5">
              <div class="control">
                <div>
                  <div class="editor-container" bind:this={editorContainer} />
                </div>
              </div>
            </div>

            <div class="field mt-5">
              <div class="control">
                <div class="editor-container" bind:this={responseEditorContainer} />
              </div>
            </div>
          </div>
        </td>
      </tr>
    </tbody>
  </table>
</div>

<style>
  .editor-container {
    width: 100%;
    height: 240px;
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
