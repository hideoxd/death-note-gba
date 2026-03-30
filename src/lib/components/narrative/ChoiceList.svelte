<script lang="ts">
  import { gameState } from '$lib/stores/gameState';
  import { canContinueFromCurrentNode, choiceOptions, gameplayHint, unreachableCurrentNode } from '$lib/stores/selectors';

  const selectChoice = (choiceId: string) => {
    gameState.selectChoice(choiceId);
  };

  const continueNode = () => {
    gameState.continueNode();
  };
</script>

<section class="choice-list">
  {#if $choiceOptions.length === 0}
    {#if $canContinueFromCurrentNode}
      <button type="button" class="btn continue-btn" on:click={continueNode}>
        > Continue
      </button>
    {:else if $unreachableCurrentNode}
      <p class="empty">Scene locked.</p>
    {:else}
      <p class="empty">No choices.</p>
    {/if}
  {:else}
    {#each $choiceOptions as choice, i}
      <button
        type="button"
        class="btn"
        class:recommended={choice.isRecommended}
        on:click={() => selectChoice(choice.id)}
        disabled={choice.disabled}
      >
        <span class="marker">{choice.isRecommended ? '*' : '>'}</span>
        {choice.label}
        {#if choice.isRecommended}<small>REC</small>{/if}
      </button>

      {#if choice.unmet.length > 0}
        <p class="lock">LOCK: {choice.unmet.join(' | ')}</p>
      {/if}
    {/each}
  {/if}

  <p class="hint">{$gameplayHint}</p>
</section>

<style>
  .choice-list {
    display: grid;
    gap: 1px;
  }

  .btn {
    width: 100%;
    display: flex;
    align-items: center;
    gap: 2px;
    padding: 2px 3px;
    border: 1px solid rgba(200, 0, 0, 0.15);
    background: linear-gradient(180deg, rgba(22, 10, 12, 0.95) 0%, rgba(14, 7, 9, 0.95) 100%);
    color: #b0a8a8;
    font-size: 5px;
    font-family: var(--font-pixel, monospace);
    line-height: 1.2;
    cursor: pointer;
    text-align: left;
    text-transform: uppercase;
    transition: all 120ms;
  }

  .btn:hover:not(:disabled) {
    background: linear-gradient(180deg, rgba(40, 14, 14, 0.95) 0%, rgba(25, 9, 9, 0.95) 100%);
    border-color: rgba(200, 0, 0, 0.3);
    color: #d0c8c8;
    transform: translateX(1px);
  }

  .btn:disabled {
    opacity: 0.3;
    cursor: not-allowed;
  }

  .marker {
    font-size: 4px;
    color: #cc0000;
    flex-shrink: 0;
  }

  .recommended {
    border-color: rgba(80, 160, 100, 0.25);
    background: linear-gradient(180deg, rgba(12, 25, 16, 0.95) 0%, rgba(8, 18, 10, 0.95) 100%);
  }

  .recommended .marker { color: #5cb85c; }

  .recommended:hover:not(:disabled) {
    border-color: rgba(80, 160, 100, 0.4);
  }

  small {
    font-size: 3px;
    color: #5cb85c;
    border: 1px solid rgba(80, 160, 100, 0.25);
    padding: 0 1px;
    margin-left: auto;
  }

  .continue-btn {
    justify-content: center;
    border-color: rgba(80, 80, 120, 0.15);
    background: linear-gradient(180deg, rgba(12, 10, 18, 0.95) 0%, rgba(8, 7, 12, 0.95) 100%);
  }

  .lock {
    margin: 0;
    font-size: 4px;
    color: #aa5555;
    font-family: var(--font-pixel, monospace);
    padding-left: 6px;
  }

  .empty {
    margin: 0;
    font-size: 4px;
    color: #504848;
    font-family: var(--font-pixel, monospace);
  }

  .hint {
    margin: 1px 0 0;
    font-size: 4px;
    line-height: 1.25;
    color: #7f7070;
    font-family: var(--font-pixel, monospace);
  }
</style>
