<script lang="ts">
  import shoulders from './about.shoulders-of-giants.json'

  // randomize the order of the shoulders
  const randomizedShoulders = shoulders.sort(() => Math.random() - 0.5)

  let version: string
  ;(async function (): Promise<void> {
    version = await window.KulalaApi.getAppVersion()
  })()

  const GITHUB_REPO_URL = 'https://github.com/mistweaverco/kulala'

  const externalLinkClickHandler = (target: HTMLElement, url: string): void => {
    window.open(url, '_blank')
  }

  function openExternalURL(e: MouseEvent & { currentTarget: HTMLButtonElement }): void {
    const url = e.currentTarget.dataset.url
    if (!url) return

    externalLinkClickHandler(e.currentTarget, url)
  }
</script>

<div class="container p-5 content">
  <h1 class="title">About</h1>
  <p>You are using <code>{version}</code> of Kulala</p>
  <hr />

  <button class="button is-secondary" data-url="https://kulala.mwco.app" on:click={openExternalURL}>
    <span class="icon">
      <i class="fa-solid fa-globe"></i>
    </span>
    <strong>Website</strong>
  </button>
  <button
    class="button is-secondary"
    data-url="{GITHUB_REPO_URL}/issues/new"
    on:click={openExternalURL}
  >
    <span class="icon">
      <i class="fa-solid fa-bug"></i>
    </span>
    <strong>Report a bug</strong>
  </button>
  <button class="button is-secondary" data-url={GITHUB_REPO_URL} on:click={openExternalURL}>
    <span class="icon">
      <i class="fa-solid fa-code"></i>
    </span>
    <strong>See the code</strong>
  </button>
  <button
    class="button is-secondary"
    data-url="{GITHUB_REPO_URL}/blob/main/PRIVACY.md"
    on:click={openExternalURL}
  >
    <span class="icon">
      <i class="fa-solid fa-lock"></i>
    </span>
    <strong>Privacy Policy</strong>
  </button>
  <button
    class="button is-secondary"
    data-url="{GITHUB_REPO_URL}/blob/main/TOS.md"
    on:click={openExternalURL}
  >
    <span class="icon">
      <i class="fa-solid fa-book"></i>
    </span>
    <strong>Terms of Service</strong>
  </button>
  <button
    class="button is-secondary"
    data-url="{GITHUB_REPO_URL}/blob/main/CODE_OF_CONDUCT.md"
    on:click={openExternalURL}
  >
    <span class="icon">
      <i class="fa-solid fa-heart"></i>
    </span>
    <strong>Code of Conduct</strong>
  </button>
  <hr />
  <h2 class="title is-4">Shoulders of giants</h2>
  <p>A collection of open-source projects that Kulala relies on.</p>
  <ul>
    {#each randomizedShoulders as shoulder}
      <li>
        <p>
          <a href={shoulder.url} target="_blank" rel="noopener">
            <strong>{shoulder.title}</strong>
            {shoulder.license ? '- ' + shoulder.license : ''}
          </a>
        </p>
        <p>{shoulder.description}</p>
        <p>{shoulder.usage}</p>
        <hr />
      </li>
    {/each}
  </ul>
</div>
