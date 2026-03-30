<script lang="ts">
  export let text: string[] = [];
</script>

<section class="dialogue-box" aria-live="polite">
  {#if text.length === 0}
    <p class="empty">...</p>
  {:else}
    {#each text as line, i}
      <p style="animation-delay:{i * 40}ms">{line}</p>
    {/each}
  {/if}
  <div class="cursor-blink">▼</div>
</section>

<style>
  .dialogue-box {
    min-height: 28px;
    padding: 3px 5px 7px;
    border: 1px solid rgba(200, 0, 0, 0.15);
    background: linear-gradient(180deg, rgba(12, 6, 8, 0.98) 0%, rgba(8, 4, 6, 0.98) 100%);
    display: grid;
    align-content: start;
    gap: 1px;
    position: relative;
    box-shadow: inset 0 0 8px rgba(0, 0, 0, 0.5);
    min-width: 0;
  }

  /* Corner accents */
  .dialogue-box::before,
  .dialogue-box::after {
    content: '';
    position: absolute;
    width: 3px;
    height: 3px;
    border-color: rgba(200, 0, 0, 0.25);
    border-style: solid;
  }

  .dialogue-box::before {
    top: 1px;
    left: 1px;
    border-width: 1px 0 0 1px;
  }

  .dialogue-box::after {
    bottom: 1px;
    right: 1px;
    border-width: 0 1px 1px 0;
  }

  p {
    margin: 0;
    font-size: 6px;
    font-family: var(--font-vt, 'VT323', monospace);
    line-height: 1.4;
    color: #d0c8c8;
    text-shadow: 1px 1px 0px rgba(0, 0, 0, 0.8);
    animation: text-appear 150ms ease-out both;
    white-space: normal;
    overflow-wrap: anywhere;
  }

  @keyframes text-appear {
    from { opacity: 0; }
    to { opacity: 1; }
  }

  .empty {
    color: #403838;
    animation: none;
  }

  .cursor-blink {
    position: absolute;
    bottom: 1px;
    right: 3px;
    font-size: 4px;
    color: rgba(200, 0, 0, 0.35);
    animation: blink 1s steps(2, end) infinite;
  }

  @keyframes blink {
    0%, 49% { opacity: 1; }
    50%, 100% { opacity: 0; }
  }
</style>
