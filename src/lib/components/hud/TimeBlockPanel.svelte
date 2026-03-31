<script lang="ts">
  import { gameState } from '$lib/stores/gameState';
  import { actionsRemaining, gameplayHint } from '$lib/stores/selectors';

  $: restHint =
    $gameState.stats.willpower < 25
      ? 'Willpower critical. Prioritize recovery actions.'
      : 'Willpower stable.';

  const advance = () => {
    gameState.advanceTime(1);
  };
</script>

<section class="panel">
  <div class="header-row">
    <h3>⧗ TIME</h3>
    <span class="value">{$actionsRemaining} left</span>
  </div>
  <button type="button" on:click={advance}>Skip ▸</button>
  <p class="meta">Will {$gameState.stats.willpower} | {restHint}</p>
  <p class="hint">{$gameplayHint}</p>
</section>

<style>
  .panel {
    display: grid;
    gap: 2px;
    padding: 3px 4px;
    border: 1px solid rgba(200, 0, 0, 0.2);
    background: linear-gradient(180deg, rgba(18, 10, 12, 0.95) 0%, rgba(10, 6, 8, 0.95) 100%);
    box-shadow: inset 0 0 6px rgba(0, 0, 0, 0.5);
    flex-shrink: 0;
    overflow: hidden;
  }

  .header-row {
    display: flex;
    justify-content: space-between;
    align-items: center;
  }

  h3 {
    margin: 0;
    font-size: 5px;
    font-family: var(--font-pixel, monospace);
    color: #cc0000;
    letter-spacing: 0.5px;
    text-shadow: 0 0 3px rgba(200, 0, 0, 0.3);
  }

  .value {
    font-size: 5px;
    font-family: var(--font-pixel, monospace);
    color: #b0a0a0;
  }

  button {
    border: 1px solid rgba(200, 0, 0, 0.2);
    background: linear-gradient(180deg, rgba(30, 12, 12, 0.95) 0%, rgba(18, 6, 6, 0.95) 100%);
    color: #a09090;
    padding: 2px 4px;
    font-size: 5px;
    font-family: var(--font-pixel, monospace);
    text-transform: uppercase;
    cursor: pointer;
    transition: all 150ms;
  }

  button:hover {
    background: linear-gradient(180deg, rgba(50, 15, 15, 0.95) 0%, rgba(30, 8, 8, 0.95) 100%);
    border-color: rgba(200, 0, 0, 0.4);
    color: #d0c0c0;
  }

  .hint {
    margin: 0;
    font-size: 4px;
    line-height: 1.3;
    font-family: var(--font-pixel, monospace);
    color: #8a7777;
  }

  .meta {
    margin: 0;
    font-size: 4px;
    line-height: 1.25;
    color: #6f9b78;
    font-family: var(--font-pixel, monospace);
  }
</style>
