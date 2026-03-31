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
  $: speakerLabel = speaker.toLowerCase();

  $: pixelPattern = (() => {
    if (speakerLabel === 'l') {
      return [
        '........',
        '..1111..',
        '.122221.',
        '.123321.',
        '.123321.',
        '.122221.',
        '..1111..',
        '........'
      ];
    }

    if (speakerLabel === 'ryuk') {
      return [
        '..1..1..',
        '.111111.',
        '11222211',
        '12333321',
        '12333321',
        '11222211',
        '.111111.',
        '..1..1..'
      ];
    }

    if (speakerLabel === 'misa') {
      return [
        '.111111.',
        '11222211',
        '12233221',
        '12344321',
        '12344321',
        '12233221',
        '11222211',
        '.111111.'
      ];
    }

    return [
      '.111111.',
      '11222211',
      '12233221',
      '12333321',
      '12333321',
      '12233221',
      '11222211',
      '.111111.'
    ];
  })();

  const pixelColor = (value: string): string => {
    if (value === '1') return `${borderColor}66`;
    if (value === '2') return `${borderColor}99`;
    if (value === '3') return `${borderColor}cc`;
    if (value === '4') return '#f4f4f4';
    return 'transparent';
  };
</script>

<aside class="portrait-panel">
  <div class="portrait" aria-label="{speaker} portrait" style="border-color:{borderColor}44;">
    <div class="portrait-bg" style="background:radial-gradient(circle at 35% 30%, {borderColor}22, transparent 60%);"></div>
    <div class="portrait-grid" aria-hidden="true">
      {#each pixelPattern as row}
        {#each row.split('') as pixel}
          <i style="background:{pixelColor(pixel)}"></i>
        {/each}
      {/each}
    </div>
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

  .portrait::after {
    content: '';
    position: absolute;
    inset: 0;
    background: linear-gradient(180deg, transparent 35%, rgba(0, 0, 0, 0.14) 100%);
    pointer-events: none;
  }

  .portrait-bg {
    position: absolute;
    inset: 0;
    pointer-events: none;
  }

  .portrait-grid {
    position: relative;
    z-index: 1;
    width: 24px;
    height: 24px;
    display: grid;
    grid-template-columns: repeat(8, 1fr);
    grid-template-rows: repeat(8, 1fr);
    image-rendering: pixelated;
    animation: portrait-bob 1400ms steps(2, end) infinite;
  }

  .portrait-grid i {
    width: 3px;
    height: 3px;
    display: block;
  }

  .initial {
    position: relative;
    font-size: 14px;
    font-family: var(--font-death-note, serif);
    text-shadow: 0 0 6px currentColor;
    z-index: 2;
    opacity: 0.22;
  }

  @keyframes portrait-bob {
    0%,
    100% {
      transform: translateY(0);
    }
    50% {
      transform: translateY(1px);
    }
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
