<script lang="ts">
  import { fade, fly } from 'svelte/transition';

  import { gameState } from '$lib/stores/gameState';
  import { playNotebookScribble } from '$lib/utils/sfx';

  import type { DeathCause } from '$lib/types/game';

  type DeskMode = 'investigation' | 'writing';

  const causeOptions: {
    id: DeathCause;
    short: string;
    label: string;
    intel: number;
    willpower: number;
  }[] = [
    { id: 'heart-attack', short: 'H', label: 'Heart', intel: 2, willpower: 14 },
    { id: 'accident', short: 'A', label: 'Accid.', intel: 3, willpower: 18 },
    { id: 'poisoning', short: 'P', label: 'Poison', intel: 3, willpower: 20 },
    { id: 'suicide', short: 'S', label: 'Suicide', intel: 4, willpower: 22 }
  ];

  let deskMode: DeskMode = 'investigation';

  $: targets = $gameState.investigation.targets;
  $: targetCount = targets.length;
  $: activeIndex = Math.max(0, Math.min($gameState.investigation.activeTargetIndex, Math.max(targetCount - 1, 0)));
  $: activeTarget = targets[activeIndex];
  $: selectedCause = $gameState.investigation.selectedCause;
  $: causeSpec = causeOptions.find((entry) => entry.id === selectedCause) ?? causeOptions[0];
  $: actionLocked = $gameState.phase !== 'playing' || $gameState.actionEconomy.actionsRemaining <= 0;

  $: canInvestigateName = Boolean(activeTarget && !activeTarget.eliminated && !activeTarget.knownName && !actionLocked);
  $: canInvestigateNews = Boolean(
    activeTarget &&
      !activeTarget.eliminated &&
      (!activeTarget.knownFace || activeTarget.faceSource !== 'news-clip') &&
      !actionLocked
  );
  $: canInvestigateSocial = Boolean(
    activeTarget &&
      !activeTarget.eliminated &&
      (!activeTarget.knownFace || activeTarget.faceSource !== 'social-feed') &&
      !actionLocked
  );

  $: canWriteJudgment = Boolean(
    activeTarget &&
      !activeTarget.eliminated &&
      activeTarget.knownName &&
      activeTarget.knownFace &&
      $gameState.stats.intel >= causeSpec.intel &&
      $gameState.stats.willpower >= causeSpec.willpower &&
      $gameState.inventory.notebookPages > 0 &&
      !actionLocked
  );

  $: notebookBlockReason = (() => {
    if (!activeTarget) return 'No target selected.';
    if (activeTarget.eliminated) return 'Target already removed.';
    if (!activeTarget.knownName || !activeTarget.knownFace) return 'Need true name + face.';
    if ($gameState.stats.intel < causeSpec.intel) return `Intel ${causeSpec.intel} required.`;
    if ($gameState.stats.willpower < causeSpec.willpower) return `Will ${causeSpec.willpower} required.`;
    if ($gameState.inventory.notebookPages <= 0) return 'No notebook pages left.';
    if (actionLocked) return 'No actions left this block.';
    return 'Ready.';
  })();

  const shiftTarget = (delta: number) => {
    if (targetCount <= 0) return;
    const next = (activeIndex + delta + targetCount) % targetCount;
    gameState.setInvestigationTarget(next);
  };

  const setCause = (cause: DeathCause) => {
    gameState.setJudgmentCause(cause);
  };

  const investigateName = () => {
    if (!canInvestigateName) return;
    gameState.investigateTargetName();
  };

  const investigateFace = (source: 'news-clip' | 'social-feed') => {
    if (source === 'news-clip' && !canInvestigateNews) return;
    if (source === 'social-feed' && !canInvestigateSocial) return;
    gameState.investigateTargetFace(source);
  };

  const writeJudgment = () => {
    if (!canWriteJudgment) return;
    playNotebookScribble();
    gameState.writeJudgment();
  };
</script>

<section class="intel-desk">
  <h3>⌖ NOTE</h3>

  <div class="mode-tabs">
    <button
      type="button"
      class:active={deskMode === 'investigation'}
      on:click={() => (deskMode = 'investigation')}
    >
      INV
    </button>
    <button
      type="button"
      class:active={deskMode === 'writing'}
      on:click={() => (deskMode = 'writing')}
    >
      WRITE
    </button>
  </div>

  {#if activeTarget}
    <div class="target-row">
      <button type="button" class="mini" on:click={() => shiftTarget(-1)} disabled={targetCount <= 1}>◂</button>

      <div class="target-meta">
        <p class="target">T{activeIndex + 1}: {activeTarget.alias}</p>
        <p class="intel-state">
          <span class:ok={activeTarget.knownName}>N</span>
          <span class:ok={activeTarget.knownFace}>F</span>
          {#if activeTarget.eliminated}
            <span class="dead">DONE</span>
          {/if}
        </p>
      </div>

      <button type="button" class="mini" on:click={() => shiftTarget(1)} disabled={targetCount <= 1}>▸</button>
    </div>
  {/if}

  {#if deskMode === 'investigation'}
    <div class="pane" in:fly={{ y: 2, duration: 120 }} out:fade={{ duration: 90 }}>
      <div class="actions inv-grid">
        <button type="button" on:click={investigateName} disabled={!canInvestigateName}>Name</button>
        <button type="button" on:click={() => investigateFace('news-clip')} disabled={!canInvestigateNews}
          >News</button
        >
        <button type="button" on:click={() => investigateFace('social-feed')} disabled={!canInvestigateSocial}
          >Social</button
        >
      </div>
      <p class="hint">
        {#if activeTarget?.knownName && activeTarget?.knownFace}
          Target is writable.
        {:else}
          Unlock both N + F before writing.
        {/if}
      </p>
    </div>
  {:else}
    <div class="pane" in:fly={{ y: 2, duration: 120 }} out:fade={{ duration: 90 }}>
      <div class="actions cause-grid">
        {#each causeOptions as cause}
          <button
            type="button"
            class:selected={cause.id === selectedCause}
            title={cause.label}
            on:click={() => setCause(cause.id)}
          >
            {cause.short}
          </button>
        {/each}
      </div>
      <p class="cost">Intel {causeSpec.intel} | Will {causeSpec.willpower}</p>
      <button type="button" class="judgment" on:click={writeJudgment} disabled={!canWriteJudgment}>WRITE</button>
      <p class="lock">{notebookBlockReason}</p>
    </div>
  {/if}
</section>

<style>
  .intel-desk {
    display: grid;
    gap: 2px;
    padding: 3px 4px;
    border: 1px solid rgba(200, 0, 0, 0.2);
    background: linear-gradient(180deg, rgba(18, 10, 12, 0.95) 0%, rgba(10, 6, 8, 0.95) 100%);
    box-shadow: inset 0 0 6px rgba(0, 0, 0, 0.5);
    flex-shrink: 0;
    overflow: hidden;
  }

  h3 {
    margin: 0;
    font-size: 5px;
    font-family: var(--font-pixel, monospace);
    color: #cc0000;
    letter-spacing: 0.5px;
    text-shadow: 0 0 3px rgba(200, 0, 0, 0.3);
  }

  .mode-tabs {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 1px;
  }

  .mode-tabs button {
    border: 1px solid rgba(200, 0, 0, 0.15);
    background: rgba(20, 8, 10, 0.7);
    color: #756666;
    font-size: 4px;
    font-family: var(--font-pixel, monospace);
    text-transform: uppercase;
    padding: 1px 0;
    letter-spacing: 0.4px;
    cursor: pointer;
  }

  .mode-tabs button.active {
    color: #d0b9b9;
    border-color: rgba(200, 0, 0, 0.34);
    background: linear-gradient(180deg, rgba(42, 14, 16, 0.95) 0%, rgba(22, 8, 10, 0.95) 100%);
  }

  .target-row {
    display: grid;
    grid-template-columns: 10px minmax(0, 1fr) 10px;
    align-items: center;
    gap: 1px;
  }

  .mini {
    border: 1px solid rgba(200, 0, 0, 0.16);
    background: rgba(22, 10, 12, 0.9);
    color: #927b7b;
    padding: 1px 0;
    font-size: 5px;
    font-family: var(--font-pixel, monospace);
    cursor: pointer;
  }

  .target-meta {
    min-width: 0;
    display: grid;
    gap: 1px;
  }

  .target {
    margin: 0;
    font-size: 4px;
    color: #9f8d8d;
    font-family: var(--font-pixel, monospace);
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .intel-state {
    margin: 0;
    display: flex;
    gap: 3px;
    align-items: center;
    font-size: 4px;
    color: #675a5a;
    font-family: var(--font-pixel, monospace);
    letter-spacing: 0.2px;
  }

  .intel-state span.ok {
    color: #79ba80;
  }

  .intel-state .dead {
    color: #d57f7f;
  }

  .pane {
    display: grid;
    gap: 2px;
    padding: 2px;
    border: 1px solid rgba(200, 0, 0, 0.14);
    background: rgba(14, 7, 9, 0.86);
  }

  .actions {
    display: grid;
    gap: 1px;
  }

  .inv-grid {
    grid-template-columns: repeat(3, 1fr);
  }

  .cause-grid {
    grid-template-columns: repeat(4, 1fr);
  }

  .actions button {
    border: 1px solid rgba(200, 0, 0, 0.18);
    background: linear-gradient(180deg, rgba(28, 12, 14, 0.95) 0%, rgba(18, 6, 8, 0.95) 100%);
    color: #9f8b8b;
    padding: 1px 0;
    font-size: 4px;
    font-family: var(--font-pixel, monospace);
    text-transform: uppercase;
    cursor: pointer;
    transition: all 110ms;
  }

  .actions button.selected {
    color: #d9c487;
    border-color: rgba(196, 164, 74, 0.45);
    background: linear-gradient(180deg, rgba(30, 24, 12, 0.95) 0%, rgba(17, 14, 7, 0.95) 100%);
  }

  .actions button:hover:not(:disabled),
  .judgment:hover:not(:disabled),
  .mini:hover:not(:disabled) {
    border-color: rgba(200, 0, 0, 0.35);
    color: #d8c1c1;
  }

  button:disabled {
    opacity: 0.36;
    cursor: not-allowed;
  }

  .cost {
    margin: 0;
    font-size: 4px;
    color: #a78e68;
    font-family: var(--font-pixel, monospace);
  }

  .judgment {
    border: 1px solid rgba(196, 164, 74, 0.24);
    background: linear-gradient(180deg, rgba(28, 22, 11, 0.95) 0%, rgba(14, 11, 6, 0.95) 100%);
    color: #b8a471;
    padding: 2px 3px;
    font-size: 4px;
    font-family: var(--font-pixel, monospace);
    text-transform: uppercase;
    cursor: pointer;
    letter-spacing: 0.6px;
  }

  .hint,
  .lock {
    margin: 0;
    font-size: 4px;
    font-family: var(--font-pixel, monospace);
    line-height: 1.2;
  }

  .hint {
    color: #7f8f99;
  }

  .lock {
    color: #a76c6c;
  }
</style>
