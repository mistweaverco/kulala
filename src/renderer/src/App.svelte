<script lang="ts">
  import Navigation from './Navigation.svelte'
  import ExplorerView from './views/explorer.svelte'
  import AboutView from './views/about.svelte'
  import { useActiveView } from './stores'
  const activeView = useActiveView()
</script>

<Navigation />

<section class="main-content container">
  {#if $activeView === 'explorer'}
    <ExplorerView />
  {:else if $activeView === 'about'}
    <AboutView />
  {/if}
</section>
