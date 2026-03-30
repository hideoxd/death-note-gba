<script lang="ts">
  import { gameState } from '$lib/stores/gameState';
  import { activeMilestoneInfo, canonDeadlineInfo } from '$lib/stores/selectors';
</script>

<section class="tracker">
  <div class="header-row">
    <h3>◎ CANON</h3>
    {#if $gameState.mode === 'anime-canon'}
      <span class="status {$gameState.canon.fractured ? 'bad' : 'good'}">
        {$gameState.canon.fractured ? '✕' : '✓'}
      </span>
    {/if}
  </div>
  {#if $gameState.mode !== 'anime-canon'}
    <p class="off">Divergent</p>
  {:else if $activeMilestoneInfo}
    <p>{$activeMilestoneInfo.label}</p>
    <p class="dim">Flags {$activeMilestoneInfo.metFlags.length}/{$activeMilestoneInfo.requiredFlags.length}</p>

    {#if $canonDeadlineInfo}
      <p class="window">Window D{$canonDeadlineInfo.dayMin}-D{$canonDeadlineInfo.dayMax} ({$canonDeadlineInfo.deadlineBlock})</p>
      <p class="deadline {$canonDeadlineInfo.urgency}">
        {$canonDeadlineInfo.blocksUntilDeadline <= 0
          ? 'Deadline reached'
          : `${$canonDeadlineInfo.blocksUntilDeadline} block(s) left`}
      </p>

      {#if $canonDeadlineInfo.missingFlags.length > 0}
        <p class="missing">Need: {$canonDeadlineInfo.missingFlags.join(', ')}</p>
      {/if}
    {/if}
  {/if}
</section>

<style>
  .tracker {
    display: grid;
    gap: 1px;
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

  .status {
    font-size: 5px;
    font-family: var(--font-pixel, monospace);
  }

  .good { color: #5cb85c; }
  .bad { color: #e04040; }

  p {
    margin: 0;
    font-size: 4px;
    font-family: var(--font-pixel, monospace);
    color: #a09090;
  }

  .window {
    color: #8e889f;
  }

  .deadline {
    font-size: 4px;
    letter-spacing: 0.2px;
  }

  .deadline.stable {
    color: #6e9aa0;
  }

  .deadline.medium {
    color: #b89a5a;
  }

  .deadline.high {
    color: #d3844f;
  }

  .deadline.critical {
    color: #e45a5a;
    text-shadow: 0 0 4px rgba(228, 90, 90, 0.25);
  }

  .missing {
    color: #b38e8e;
    line-height: 1.2;
  }

  .dim { color: #605858; }
  .off { color: #504848; font-style: italic; }
</style>
