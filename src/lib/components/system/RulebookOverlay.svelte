<script lang="ts">
  import { fade, fly } from 'svelte/transition';

  export let open = false;
  export let onClose: () => void = () => {};

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
    <div class="panel" role="dialog" aria-modal="true" aria-label="Death Note Rulebook" in:fly={{ y: 4, duration: 140 }}>
      <header>
        <h3>DEATH NOTE RULES</h3>
        <button type="button" on:click={onClose}>X</button>
      </header>

      <div class="body">
        <p>I. The human whose name is written in this note shall die.</p>
        <p>II. This notebook takes effect only when the writer has seen the target's face.</p>
        <p>III. If cause of death is not specified in 40 seconds, heart attack is enacted.</p>
        <p>IV. Specific causes may be written within the timing window after entering a name.</p>
        <p>V. Clustered kills in one region accelerate L's geo-profiling suspicion model.</p>
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
    overflow-y: auto;
    padding: 4px 6px;
    display: grid;
    gap: 2px;
    font-family: var(--font-pixel, monospace);
  }

  .body p {
    margin: 0;
    font-size: 4px;
    line-height: 1.25;
    color: #c2b089;
  }
</style>
