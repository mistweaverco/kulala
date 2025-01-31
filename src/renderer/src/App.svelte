<script lang="ts">
  import Navigation from './Navigation.svelte'
  import HomeView from './views/home.svelte'
  import AboutView from './views/about.svelte'
  import { useActiveView } from './stores'
  const activeView = useActiveView()
</script>

<Navigation />

{#if $activeView === 'home'}
  <HomeView />
{:else if $activeView === 'about'}
  <AboutView />
{/if}
