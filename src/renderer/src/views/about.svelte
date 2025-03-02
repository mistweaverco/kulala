<script lang="ts">
  import shoulders from './about.shoulders-of-giants.json'

  // randomize the order of the shoulders
  const randomizedShoulders = shoulders.sort(() => Math.random() - 0.5)

  let version: string
  ;(async function (): Promise<void> {
    version = await window.KulalaApi.getAppVersion()
  })()

  const GITHUB_REPO_URL = 'https://github.com/mistweaverco/kulala'

  const externalLinkClickHandler = (url: string): void => {
    window.open(url, '_blank')
  }

  function openExternalURL(e: MouseEvent & { currentTarget: HTMLButtonElement }): void {
    const url = e.currentTarget.dataset.url
    if (!url) return

    externalLinkClickHandler(url)
  }
</script>

<div class="container p-5 content">
  <div class="hero">
    <div class="hero-content flex-col lg:flex-row-reverse">
      <div>
        <h1 class="text-5xl font-bold">About</h1>
        <div class="py-6">
          <p>A minimal REST-Client GUI for Mac, Linux and Windows.</p>
          <p>Kulala is swahili for "rest" or "relax".</p>
          <p>It allows you to make HTTP requests via .http files.</p>
          <p>No login 🌈, no tracking 🕵️‍♀️, No Ads 🔥, no BS 💩.</p>
        </div>
      </div>
    </div>
  </div>

  <div role="alert" class="alert alert-info alert-soft">
    <span class="icon">
      <i class="fa-solid fa-info-circle"></i>
    </span>
    <span>You are using <code>{version}</code> of Kulala</span>
  </div>

  <hr class="m-5" />

  <button class="btn btn-ghost" data-url="https://getkulala.net" on:click={openExternalURL}>
    <span class="icon">
      <i class="fa-solid fa-globe"></i>
    </span>
    <strong>Website</strong>
  </button>
  <button class="btn btn-ghost" data-url="{GITHUB_REPO_URL}/issues/new" on:click={openExternalURL}>
    <span class="icon">
      <i class="fa-solid fa-bug"></i>
    </span>
    <strong>Report a bug</strong>
  </button>
  <button class="btn btn-ghost" data-url={GITHUB_REPO_URL} on:click={openExternalURL}>
    <span class="icon">
      <i class="fa-solid fa-code"></i>
    </span>
    <strong>See the code</strong>
  </button>
  <button
    class="btn btn-ghost"
    data-url="{GITHUB_REPO_URL}/blob/main/PRIVACY.md"
    on:click={openExternalURL}
  >
    <span class="icon">
      <i class="fa-solid fa-lock"></i>
    </span>
    <strong>Privacy Policy</strong>
  </button>
  <button
    class="btn btn-ghost"
    data-url="{GITHUB_REPO_URL}/blob/main/TOS.md"
    on:click={openExternalURL}
  >
    <span class="icon">
      <i class="fa-solid fa-book"></i>
    </span>
    <strong>Terms of Service</strong>
  </button>
  <button
    class="btn btn-ghost"
    data-url="{GITHUB_REPO_URL}/blob/main/CODE_OF_CONDUCT.md"
    on:click={openExternalURL}
  >
    <span class="icon">
      <i class="fa-solid fa-heart"></i>
    </span>
    <strong>Code of Conduct</strong>
  </button>

  <hr class="m-5" />

  <div role="alert" class="alert alert-success alert-soft mb-5">
    <span class="icon">
      <i class="fa-solid fa-code"></i>
    </span>
    <span>A collection of open-source projects that Kulala relies on.</span>
  </div>

  <ul>
    {#each randomizedShoulders as shoulder}
      <div class="collapse bg-base-100 border border-base-300 m-5">
        <input type="radio" name="random-shoulders-accordion-1" />
        <div class="collapse-title font-semibold">
          {shoulder.title}
        </div>
        <div class="collapse-content text-sm">
          <p>{shoulder.description}</p>
          <p>{shoulder.usage}</p>
          <a href={shoulder.url} target="_blank" rel="noopener noreferrer">
            <button class="btn btn-ghost">
              <span class="icon">
                <i class="fa-solid fa-globe"></i>
              </span>
              {shoulder.url}
            </button>
          </a>
          {shoulder.license ? ' - ' + shoulder.license : ''}
        </div>
      </div>
    {/each}
  </ul>
</div>
