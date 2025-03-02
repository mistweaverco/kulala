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

<div class="navbar bg-base-100 shadow-sm">
  <div class="flex-1">
    <button
      class="btn text-xl {$activeView === 'explorer' ? 'btn-primary' : 'btn-ghost'}"
      data-action="explorer"
      on:click={handleTopButtonsClick}
    >
      <span class="icon">
        <i class="fa-solid fa-compass"></i>
      </span>
      Explorer
    </button>
  </div>
  <div class="flex gap-2">
    <input type="text" placeholder="Search" class="input input-bordered w-24 md:w-auto" />
    <div class="dropdown dropdown-end">
      <div tabindex="0" role="button" class="btn btn-ghost btn-circle avatar">
        <div class="w-10 rounded-full">
          <i class="fa-solid fa-user pt-3"></i>
        </div>
      </div>
      <ul
        tabindex="-1"
        class="menu menu-sm dropdown-content bg-base-100 rounded-box z-1 mt-3 w-52 p-2 shadow"
      >
        <li><button>Settings</button></li>
        <li><button data-action="about" on:click={handleTopButtonsClick}>About</button></li>
      </ul>
    </div>
  </div>
</div>
