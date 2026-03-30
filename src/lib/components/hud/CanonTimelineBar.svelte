<script lang="ts">
  import { gameState } from '$lib/stores/gameState';

  const stageActive = (stage: number): boolean => {
    if (stage === 1) {
      return !$gameState.flags.canon_episode_02_started;
    }

    if (stage === 2) {
      return Boolean($gameState.flags.canon_episode_02_started) && !$gameState.flags.canon_episode_03_started;
    }

    return Boolean($gameState.flags.canon_episode_03_started);
  };

  const stageDone = (stage: number): boolean => {
    if (stage === 1) {
      return Boolean($gameState.flags.canon_episode_02_started);
    }

    if (stage === 2) {
      return Boolean($gameState.flags.canon_episode_03_started);
    }

    return Boolean($gameState.flags.yellow_box_triggered || $gameState.flags.light_dead);
  };
</script>

{#if $gameState.mode === 'anime-canon'}
  <section class="timeline" aria-label="Canon timeline progress">
    <p class="title">CANON LINE</p>

    <div class="bar" role="list">
      <div class="step" class:active={stageActive(1)} class:done={stageDone(1)} role="listitem">
        <span>I</span>
      </div>
      <div class="step" class:active={stageActive(2)} class:done={stageDone(2)} role="listitem">
        <span>II</span>
      </div>
      <div class="step" class:active={stageActive(3)} class:done={stageDone(3)} role="listitem">
        <span>III</span>
      </div>
    </div>

    <p class="hint">
      {#if stageActive(1)}
        Rise of Kira and duel with L
      {:else if stageActive(2)}
        Second Kira and L's death
      {:else}
        Near, Mello, and Yellow Box endgame
      {/if}
    </p>
  </section>
{/if}

<style>
  .timeline {
    display: grid;
    gap: 2px;
    padding: 3px 4px;
    border: 1px solid rgba(200, 0, 0, 0.2);
    background: linear-gradient(180deg, rgba(16, 9, 11, 0.95) 0%, rgba(10, 6, 8, 0.95) 100%);
    flex-shrink: 0;
    overflow: hidden;
  }

  .title {
    margin: 0;
    font-size: 5px;
    font-family: var(--font-pixel, monospace);
    color: #a85858;
    letter-spacing: 0.05em;
  }

  .bar {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 1px;
  }

  .step {
    border: 1px solid rgba(120, 70, 70, 0.3);
    background: rgba(25, 14, 16, 0.8);
    min-height: 12px;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 1px 0 2px;
  }

  .step span {
    font-size: 5px;
    font-family: var(--font-pixel, monospace);
    color: #6a5050;
  }

  .step.active {
    border-color: rgba(190, 90, 90, 0.55);
    background: rgba(45, 16, 18, 0.95);
  }

  .step.active span {
    color: #d8a0a0;
  }

  .step.done {
    border-color: rgba(90, 150, 110, 0.4);
    background: rgba(16, 34, 22, 0.9);
  }

  .step.done span {
    color: #8cc0a0;
  }

  .hint {
    margin: 0;
    font-size: 4px;
    font-family: var(--font-pixel, monospace);
    color: #8a7474;
    line-height: 1.2;
  }
</style>
