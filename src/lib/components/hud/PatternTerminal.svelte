<script lang="ts">
  import { patternData } from '$lib/stores/selectors';

  const pct = (value: number, total: number): string => {
    if (total <= 0) return '0%';
    return `${Math.round((value / total) * 100)}%`;
  };
</script>

<section class="terminal" aria-label="L pattern terminal">
  <div class="header">L TERMINAL</div>
  <p>Total: {$patternData.total}</p>
  <p>Peak Block: {$patternData.dominantBlock.toUpperCase()}</p>
  <p>Peak Region: {$patternData.dominantRegion.toUpperCase()}</p>
  <p>MOR: {pct($patternData.byBlock.morning, $patternData.total)}</p>
  <p>AFT: {pct($patternData.byBlock.afternoon, $patternData.total)}</p>
  <p>NGT: {pct($patternData.byBlock.night, $patternData.total)}</p>
</section>

<style>
  .terminal {
    display: grid;
    gap: 1px;
    padding: 3px 4px;
    border: 1px solid rgba(74, 141, 181, 0.28);
    background: linear-gradient(180deg, rgba(10, 16, 22, 0.96) 0%, rgba(7, 12, 17, 0.96) 100%);
    box-shadow: inset 0 0 6px rgba(0, 0, 0, 0.6);
    flex-shrink: 0;
  }

  .header {
    margin: 0 0 1px;
    font-size: 5px;
    font-family: var(--font-pixel, monospace);
    color: #6fb2d8;
    letter-spacing: 0.6px;
    text-transform: uppercase;
  }

  p {
    margin: 0;
    font-size: 4px;
    line-height: 1.25;
    font-family: var(--font-pixel, monospace);
    color: #93b8cf;
  }
</style>
