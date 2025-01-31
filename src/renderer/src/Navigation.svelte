<script lang="ts">
  import { useActiveView } from './stores'
  const activeView = useActiveView()

  const handleTopButtonsClick = (evt: MouseEvent): void => {
    evt.preventDefault()
    const target = evt.target as HTMLButtonElement
    const root = target.closest('button')

    $activeView = root.dataset.action
  }
</script>

<div class="container">
  <nav class="navbar" aria-label="main navigation">
    <div class="navbar-brand p-2">
      <div class="navbar-start">
        <div class="navbar-item">
          <div class="buttons">
            <button
              class="button {$activeView === 'home' ? 'is-active is-primary' : 'is-secondary'}"
              data-action="home"
              on:click={handleTopButtonsClick}
            >
              <span class="icon">
                <i class="fa-solid fa-right-to-bracket"></i>
              </span>
              <strong>Home</strong>
            </button>
            <button
              class="button is-secondary {$activeView === 'about'
                ? 'is-active is-primary'
                : 'is-secondary'}"
              data-action="about"
              on:click={handleTopButtonsClick}
            >
              <span class="icon">
                <i class="fa-solid fa-question"></i>
              </span>
              <strong>About</strong>
            </button>
          </div>
        </div>
      </div>
    </div>
  </nav>
</div>
