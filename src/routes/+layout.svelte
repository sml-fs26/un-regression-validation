<script lang="ts">
  import { onMount } from 'svelte';
  import '$lib/styles/tokens.css';
  import '$lib/styles/typography.css';
  import '$lib/styles/role-palette.css';

  // DEV-mode inline-style motion watcher. DESIGN.md §CC#8 line 326:
  // "Inert in production." import.meta.env.DEV is false in a
  // production Vite build, so the dynamic import chunk is dead-code
  // eliminated.
  onMount(async () => {
    if (import.meta.env.DEV) {
      const { startMotionWatcher } = await import('$lib/dev/motionWatcher');
      startMotionWatcher();
    }
  });
</script>

<slot />

<style>
  /* Base page surface — DESIGN.md §Color & palette: page surface is cream. */
  :global(body) {
    margin: 0;
    background: var(--bg-cream);
    color: #111;
  }
</style>
