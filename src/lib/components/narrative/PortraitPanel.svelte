<script lang="ts">
  export let speaker = 'system';
  export let portrait = '';

  const speakerColors: Record<string, string> = {
    'light': '#cc0000',
    'l': '#4a8db5',
    'misa': '#c4a44a',
    'ryuk': '#8b6dcd',
    'system': '#605858',
  };

  $: borderColor = speakerColors[speaker.toLowerCase()] || '#605858';
</script>

<aside class="portrait-panel">
  <div class="portrait" aria-label="{speaker} portrait" style="border-color:{borderColor}44;">
    <div class="portrait-bg" style="background:radial-gradient(circle at 35% 30%, {borderColor}22, transparent 60%);"></div>
    <span class="initial" style="color:{borderColor};">{speaker.slice(0, 1).toUpperCase()}</span>
  </div>
  <p class="name">{speaker}</p>
  {#if portrait}
    <p class="variant">{portrait}</p>
  {/if}
</aside>

<style>
  .portrait-panel {
    display: grid;
    gap: 1px;
    align-content: start;
  }

  .portrait {
    width: 36px;
    height: 36px;
    border: 1px solid;
    background: linear-gradient(180deg, rgba(20, 12, 14, 0.95) 0%, rgba(12, 6, 8, 0.95) 100%);
    display: grid;
    place-items: center;
    position: relative;
    overflow: hidden;
    box-shadow: inset 0 0 6px rgba(0, 0, 0, 0.5);
  }

  .portrait-bg {
    position: absolute;
    inset: 0;
    pointer-events: none;
  }

  .initial {
    position: relative;
    font-size: 14px;
    font-family: var(--font-death-note, serif);
    text-shadow: 0 0 6px currentColor;
    z-index: 1;
  }

  .name {
    margin: 0;
    font-size: 4px;
    font-family: var(--font-pixel, monospace);
    color: #908080;
    text-transform: uppercase;
    text-align: center;
  }

  .variant {
    margin: 0;
    font-size: 3px;
    font-family: var(--font-pixel, monospace);
    color: #6e6262;
    text-transform: uppercase;
    text-align: center;
  }
</style>
