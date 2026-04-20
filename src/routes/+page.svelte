<!--
  / — the site root. Step 1 renders only the filename-as-title
  placeholder so that SvelteKit's adapter-static has a page to
  prerender and the `.assert-serif-budget` test has HTML to parse.

  The full <FilenameTitle> contract (cross-cutting signature #2,
  DESIGN.md §2, lines 248-258) ships in build step 6 (CH1). Here we
  emit only the literal title in --type-model so lint rules for this
  step have something to inspect. No DM Serif. No italic.
-->
<svelte:head>
  <title>five_deaths_of_norway.ipynb</title>
</svelte:head>

<main>
  <h1 class="type-model title">
    # five_deaths_of_norway.ipynb
  </h1>
</main>

<style>
  main {
    padding: 16px;
  }
  .title {
    margin: 0;
  }
</style>
