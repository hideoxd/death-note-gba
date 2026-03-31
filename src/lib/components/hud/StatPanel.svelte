<script lang="ts">
  import { gameState } from '$lib/stores/gameState';

  const scoreClass = (value: number, high: number, low: number): string => {
    if (value >= high) return 'good';
    if (value <= low) return 'bad';
    return 'mid';
  };
</script>

<section class="panel">
  <h3>◈ PROFILE</h3>
  <ul>
    <li>
      <span class="n">ALI</span>
      <span class="bar"><span class="f alibi" style="width:{Math.min($gameState.stats.alibi * 10, 100)}%"></span></span>
      <span class="v {scoreClass($gameState.stats.alibi, 8, 3)}">{$gameState.stats.alibi}</span>
    </li>
    <li>
      <span class="n">INT</span>
      <span class="bar"><span class="f intel" style="width:{Math.min($gameState.stats.intel * 10, 100)}%"></span></span>
      <span class="v {scoreClass($gameState.stats.intel, 6, 1)}">{$gameState.stats.intel}</span>
    </li>
    <li>
      <span class="n">MOR</span>
      <span class="bar"><span class="f moral" style="width:{Math.min(Math.max(($gameState.stats.morality + 50), 0), 100)}%"></span></span>
      <span class="v {scoreClass($gameState.stats.morality, 20, -20)}">{$gameState.stats.morality}</span>
    </li>
    <li>
      <span class="n">STR</span>
      <span class="bar"><span class="f stress" style="width:{Math.min($gameState.stats.stress, 100)}%"></span></span>
      <span class="v {scoreClass(-$gameState.stats.stress, -20, -70)}">{$gameState.stats.stress}</span>
    </li>
    <li>
      <span class="n">WIL</span>
      <span class="bar"><span class="f will" style="width:{Math.min($gameState.stats.willpower, 100)}%"></span></span>
      <span class="v {scoreClass($gameState.stats.willpower, 65, 25)}">{$gameState.stats.willpower}</span>
    </li>
  </ul>
</section>

<style>
  .panel {
    padding: 3px 4px;
    border: 1px solid rgba(200, 0, 0, 0.2);
    background: linear-gradient(180deg, rgba(18, 10, 12, 0.95) 0%, rgba(10, 6, 8, 0.95) 100%);
    box-shadow: inset 0 0 6px rgba(0, 0, 0, 0.5);
    flex-shrink: 0;
    overflow: hidden;
  }

  h3 {
    margin: 0 0 2px;
    font-size: 5px;
    font-family: var(--font-pixel, monospace);
    color: #cc0000;
    letter-spacing: 0.5px;
    text-shadow: 0 0 3px rgba(200, 0, 0, 0.3);
  }

  ul {
    margin: 0;
    padding: 0;
    list-style: none;
    display: grid;
    gap: 1px;
  }

  li {
    display: grid;
    grid-template-columns: 14px 1fr 10px;
    align-items: center;
    gap: 2px;
  }

  .n {
    font-size: 4px;
    font-family: var(--font-pixel, monospace);
    color: #605858;
    letter-spacing: 0.2px;
  }

  .bar {
    height: 3px;
    background: rgba(0, 0, 0, 0.5);
    border: 1px solid rgba(60, 40, 40, 0.25);
    position: relative;
    overflow: hidden;
  }

  .f {
    position: absolute;
    top: 0;
    left: 0;
    height: 100%;
    transition: width 300ms steps(8, end);
  }

  .alibi { background: linear-gradient(90deg, #2a5a30, #4caf50); }
  .intel { background: linear-gradient(90deg, #2a4a6a, #4a8db5); }
  .moral { background: linear-gradient(90deg, #5a5a2a, #c4a44a); }
  .stress { background: linear-gradient(90deg, #6a2a2a, #cc4040); }
  .will { background: linear-gradient(90deg, #2a5f3a, #6fc786); }

  .v {
    font-size: 5px;
    font-family: var(--font-pixel, monospace);
    text-align: right;
  }

  .good { color: #5cb85c; }
  .mid { color: #908080; }
  .bad { color: #e04040; }
</style>
