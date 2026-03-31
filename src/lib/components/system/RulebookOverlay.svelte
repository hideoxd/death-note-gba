<script lang="ts">
  import { fade } from 'svelte/transition';

  export let open = false;
  export let onClose: () => void = () => {};

  const rulePages = [
    {
      id: 'core',
      title: 'Core Rules',
      lines: [
        'I. The human whose name is written in this note shall die.',
        "II. This notebook takes effect only when the writer has seen the target's face.",
        'III. If cause of death is not specified in 40 seconds, heart attack is enacted.',
        'IV. Specific causes may be written within the timing window after entering a name.'
      ]
    },
    {
      id: 'investigation',
      title: 'Investigation',
      lines: [
        "V. Clustered kills in one region accelerate L's geo-profiling suspicion model.",
        'VI. Decoy targets are seeded in active waves. Eliminate one and suspicion surges.',
        'VII. Executions during school hours create pattern matches in surveillance logs.',
        'VIII. If suspicion reaches terminal thresholds, L will intervene directly.'
      ]
    },
    {
      id: 'eyes',
      title: 'Shinigami Eyes',
      lines: [
        'IX. SELECT toggles the Shinigami Eye lens while playing.',
        'X. While active, hidden names become visible but willpower drains each block.',
        'XI. If willpower is exhausted, the Eye forcibly deactivates.',
        'XII. Use with restraint if you intend to survive long arcs.'
      ]
    }
  ] as const;

  let pageIndex = 0;
  let pageDirection = 1;

  $: activePage = rulePages[pageIndex];

  const nextPage = () => {
    pageDirection = 1;
    pageIndex = (pageIndex + 1) % rulePages.length;
  };

  const prevPage = () => {
    pageDirection = -1;
    pageIndex = (pageIndex - 1 + rulePages.length) % rulePages.length;
  };

  const handlePanelKeydown = (event: KeyboardEvent) => {
    if (event.key === 'ArrowRight') {
      event.preventDefault();
      nextPage();
      return;
    }

    if (event.key === 'ArrowLeft') {
      event.preventDefault();
      prevPage();
      return;
    }

    if (event.key === 'Escape') {
      event.preventDefault();
      onClose();
    }
  };

  const closeOnBackdrop = (event: MouseEvent) => {
    if (event.target !== event.currentTarget) {
      return;
    }

    onClose();
  };
</script>

{#if open}
  <div class="overlay" role="button" tabindex="0" on:click={closeOnBackdrop} on:keydown={(event) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      onClose();
    }
  }} in:fade={{ duration: 120 }} out:fade={{ duration: 80 }}>
    <div
      class="panel"
      role="dialog"
      aria-modal="true"
      aria-label="Death Note Rulebook"
      tabindex="0"
      on:keydown={handlePanelKeydown}
    >
      <header>
        <h3>DEATH NOTE RULES</h3>
        <div class="controls">
          <button type="button" class="page-btn" aria-label="Previous page" on:click={prevPage}>◂</button>
          <button type="button" class="page-btn" aria-label="Next page" on:click={nextPage}>▸</button>
          <button type="button" on:click={onClose}>X</button>
        </div>
      </header>

      <div class="body">
        <div class="book-spine" aria-hidden="true"></div>
        {#key activePage.id}
          <article class="page" class:flip-forward={pageDirection > 0} class:flip-back={pageDirection < 0}>
            <h4>{activePage.title}</h4>
            {#each activePage.lines as line}
              <p>{line}</p>
            {/each}
            <p class="page-index">Page {pageIndex + 1}/{rulePages.length}</p>
          </article>
        {/key}
      </div>
    </div>
  </div>
{/if}

<style>
  .overlay {
    position: absolute;
    inset: 0;
    z-index: 24;
    display: grid;
    place-items: center;
    background: rgba(3, 2, 6, 0.9);
    backdrop-filter: blur(1px);
  }

  .overlay:focus {
    outline: none;
  }

  .panel {
    width: 190px;
    max-height: 140px;
    display: grid;
    grid-template-rows: auto minmax(0, 1fr);
    border: 1px solid rgba(185, 160, 110, 0.35);
    background: linear-gradient(180deg, rgba(30, 25, 16, 0.98) 0%, rgba(20, 16, 10, 0.98) 100%);
    box-shadow: 0 0 14px rgba(0, 0, 0, 0.55);
    perspective: 520px;
  }

  .panel:focus {
    outline: 1px solid rgba(185, 160, 110, 0.45);
    outline-offset: -1px;
  }

  header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 3px 5px;
    border-bottom: 1px solid rgba(185, 160, 110, 0.25);
    background: linear-gradient(90deg, rgba(54, 42, 22, 0.7), rgba(30, 24, 14, 0.7));
  }

  h3 {
    margin: 0;
    font-size: 5px;
    font-family: var(--font-pixel, monospace);
    color: #d8c690;
    letter-spacing: 0.4px;
  }

  .controls {
    display: inline-flex;
    gap: 2px;
  }

  .page-btn {
    width: 10px;
  }

  button {
    border: 1px solid rgba(185, 160, 110, 0.3);
    background: rgba(35, 28, 16, 0.95);
    color: #cdbb86;
    width: 12px;
    height: 10px;
    padding: 0;
    font-size: 5px;
    line-height: 1;
    font-family: var(--font-pixel, monospace);
    cursor: pointer;
  }

  .body {
    min-height: 0;
    overflow: hidden;
    padding: 4px 6px;
    position: relative;
    font-family: var(--font-pixel, monospace);
  }

  .book-spine {
    position: absolute;
    top: 3px;
    bottom: 3px;
    left: 5px;
    width: 2px;
    background: linear-gradient(180deg, rgba(120, 95, 55, 0.25), rgba(50, 38, 20, 0.35));
  }

  .page {
    height: 100%;
    padding-left: 5px;
    transform-origin: left center;
    animation-duration: 280ms;
    animation-timing-function: cubic-bezier(0.17, 0.84, 0.3, 1);
  }

  .page.flip-forward {
    animation-name: page-turn-forward;
  }

  .page.flip-back {
    animation-name: page-turn-back;
  }

  .page h4 {
    margin: 0 0 2px;
    font-size: 5px;
    color: #decb97;
    letter-spacing: 0.2px;
    text-transform: uppercase;
  }

  .body p {
    margin: 0;
    font-size: 4px;
    line-height: 1.25;
    color: #c2b089;
  }

  .page-index {
    margin-top: 3px;
    color: #8f7b57;
  }

  @keyframes page-turn-forward {
    0% {
      opacity: 0;
      transform: rotateY(-34deg) translateX(-4px);
    }
    100% {
      opacity: 1;
      transform: rotateY(0deg) translateX(0);
    }
  }

  @keyframes page-turn-back {
    0% {
      opacity: 0;
      transform: rotateY(34deg) translateX(4px);
    }
    100% {
      opacity: 1;
      transform: rotateY(0deg) translateX(0);
    }
  }
</style>
