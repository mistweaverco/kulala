<script lang="ts">
  import { onMount } from 'svelte'
  const files = [
    { name: 'advanced.http', dir: '/home/marco/projects/personal/kulala.nvim/http-examples' }
  ]
  let tabsList: HTMLUListElement
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
  onMount(() => {
    fillTabs()
  })
</script>

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
                  <a href="#">
                    <span class="icon is-small">
                      <i class="fas fa-home" aria-hidden="true"></i>
                    </span>
                    <span>Root</span>
                  </a>
                </li>
                <li>
                  <a href="#">
                    <span class="icon is-small">
                      <i class="fas fa-folder" aria-hidden="true"></i>
                    </span>
                    <span>Kulala</span>
                  </a>
                </li>
                <li>
                  <a href="#">
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
            <table class="is-fullwidth" style="border-top: 0 none;">
              <tr>
                <td style="width: 0;">
                  <div class="field" style="width: fit-content">
                    <div class="control">
                      <div class="select">
                        <select>
                          <option>GET</option>
                          <option>POST</option>
                          <option>PUT</option>
                          <option>DELETE</option>
                          <option>OPTIONS</option>
                          <option>HEAD</option>
                          <option>TRACE</option>
                          <option>CONNECT</option>
                        </select>
                      </div>
                    </div>
                  </div>
                </td>
                <td>
                  <div class="field">
                    <div class="control">
                      <div class="field has-addons">
                        <div class="control" style="width: 100%;">
                          <input
                            placeholder="https://httpbin.org/get"
                            class="input"
                            type="url"
                            value="https://httpbin.org/post"
                          />
                        </div>
                        <div class="control">
                          <button class="button is-link">
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
                <li><a>Headers</a></li>
                <li class="is-active"><a>Body</a></li>
              </ul>
            </div>

            <div class="field" style="width: fit-content">
              <div class="control">
                <div class="select">
                  <select>
                    <option>none</option>
                    <option>form-data</option>
                    <option>x-www-form-urlencoded</option>
                    <option selected>raw</option>
                    <option>binary</option>
                    <option>GraphQL</option>
                  </select>
                </div>
                <div class="select">
                  <select>
                    <option>Text</option>
                    <option>JavaScript</option>
                    <option selected>JSON</option>
                    <option>HTML</option>
                    <option>XML</option>
                  </select>
                </div>
              </div>
            </div>

            <div class="field mt-5">
              <div class="control">
                <textarea class="textarea" placeholder="Request body"></textarea>
              </div>
            </div>
          </div>
        </td>
      </tr>
    </tbody>
  </table>
</div>

<style>
  .kulala-explorer-contents {
    width: 100%;
  }
  .kulala-explorer-contents tr td {
    padding: 0;
  }
  .kulala-file-explorer {
    width: 360px;
  }
</style>
