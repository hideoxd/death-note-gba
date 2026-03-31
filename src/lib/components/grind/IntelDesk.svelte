<script lang="ts">
  import { onDestroy } from 'svelte';
  import { draw, fade, fly } from 'svelte/transition';

  import { gameState } from '$lib/stores/gameState';
  import { dualModeView, pendingCauseCountdown, shinigamiVisibleNames } from '$lib/stores/selectors';
  import {
    playHeartbeatLoop,
    playInkScratch,
    playNotebookScribble,
    stopHeartbeatLoop
  } from '$lib/utils/sfx';

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

  const causeShortLabel = (cause: DeathCause): string => {
    if (cause === 'heart-attack') return 'HA';
    if (cause === 'accident') return 'ACC';
    if (cause === 'poisoning') return 'PSN';
    return 'SUI';
  };

  const buildInkPaths = (value: string): { d: string; width: number; delay: number }[] => {
    const charCount = Math.max(1, value.length);
    const paths: { d: string; width: number; delay: number }[] = [];
    const baseline = 14;
    const charSpacing = Math.min(12, 148 / Math.max(1, charCount));

    for (let i = 0; i < charCount; i += 1) {
      const x0 = 6 + i * charSpacing;
      const pressure = 0.6 + Math.random() * 0.6;
      const jitterY = (Math.random() - 0.5) * 3;
      const strokeH = 6 + Math.random() * 4;

      // Main vertical stroke
      const mainD = `M ${x0 + 2} ${baseline - strokeH + jitterY} ` +
        `Q ${x0 + 1 + Math.random() * 2} ${baseline - strokeH * 0.3 + jitterY} ` +
        `${x0 + 3 + Math.random()} ${baseline + 2 + jitterY}`;

      paths.push({ d: mainD, width: pressure, delay: i * 60 });

      // Cross stroke for some chars
      if (i % 3 !== 1 && charSpacing > 6) {
        const crossY = baseline - strokeH * 0.4 + jitterY;
        const crossD = `M ${x0} ${crossY} L ${x0 + charSpacing * 0.7} ${crossY + (Math.random() - 0.5) * 2}`;
        paths.push({ d: crossD, width: pressure * 0.7, delay: i * 60 + 30 });
      }
    }

    // Underline flourish
    const endX = Math.min(158, 6 + charCount * charSpacing);
    const flourishD = `M 4 ${baseline + 5} Q ${endX * 0.5} ${baseline + 3} ${endX} ${baseline + 5.5}`;
    paths.push({ d: flourishD, width: 0.4, delay: charCount * 60 + 40 });

    return paths;
  };

  let inkBleed = false;
  let bleedTimer: ReturnType<typeof setTimeout> | null = null;

  const triggerInkBleed = () => {
    if (bleedTimer) clearTimeout(bleedTimer);
    inkBleed = false;
    bleedTimer = setTimeout(() => {
      inkBleed = true;
    }, 500);
  };

  $: if (inkPreview.length > 0) {
    triggerInkBleed();
  } else {
    inkBleed = false;
  }

  let deskMode: DeskMode = 'investigation';
  let notebookNameInput = '';
  let heartbeatTicker: ReturnType<typeof setInterval> | null = null;
  let deadlineTimer: ReturnType<typeof setTimeout> | null = null;
  let activeDeadlineMs = 0;
  let nowMs = 0;
  let inkDrawNonce = 0;
  let previousInkPreview = '';

  $: targets = $gameState.investigation.targets;
  $: targetCount = targets.length;
  $: activeIndex = Math.max(0, Math.min($gameState.investigation.activeTargetIndex, Math.max(targetCount - 1, 0)));
  $: activeTarget = targets[activeIndex];
  $: selectedCause = $gameState.investigation.selectedCause;
  $: causeSpec = causeOptions.find((entry) => entry.id === selectedCause) ?? causeOptions[0];
  $: actionLocked = $gameState.phase !== 'playing' || $gameState.actionEconomy.actionsRemaining <= 0;
  $: notebookEntries = $gameState.investigation.eliminationLog.slice(-5).reverse();
  $: notebookEntryCount = $gameState.investigation.eliminationLog.length;
  $: remainingPages = $gameState.inventory.notebookPages;

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
      remainingPages > 0 &&
      !actionLocked
  );

  $: notebookBlockReason = (() => {
    if (!activeTarget) return 'No target selected.';
    if (activeTarget.eliminated) return 'Target already removed.';
    if (!activeTarget.knownName || !activeTarget.knownFace) return 'Need true name + face.';
    if ($gameState.stats.intel < causeSpec.intel) return `Intel ${causeSpec.intel} required.`;
    if ($gameState.stats.willpower < causeSpec.willpower) return `Will ${causeSpec.willpower} required.`;
    if (remainingPages <= 0) return 'No notebook pages left.';
    if (actionLocked) return 'No actions left this block.';
    return 'Ready.';
  })();

  $: countdownActive = $pendingCauseCountdown && activeTarget?.id === $pendingCauseCountdown.targetId;
  $: secondsLeft = countdownActive
    ? Math.max(0, Math.ceil((($pendingCauseCountdown?.deadlineMs ?? 0) - nowMs) / 1000))
    : 0;
  $: canPrimeName = Boolean(
    activeTarget &&
      !activeTarget.eliminated &&
      activeTarget.knownName &&
      activeTarget.knownFace &&
      !countdownActive &&
      notebookNameInput.trim().length > 0
  );
  $: inkPreview = notebookNameInput.trim().toUpperCase();
  $: if (inkPreview !== previousInkPreview) {
    previousInkPreview = inkPreview;
    inkDrawNonce += 1;
  }
  $: inkPaths = buildInkPaths(inkPreview);
  $: eyeNameRows = $shinigamiVisibleNames.slice(0, 3);

  const clearHeartbeatTicker = () => {
    if (!heartbeatTicker) return;
    clearInterval(heartbeatTicker);
    heartbeatTicker = null;
  };

  const clearDeadlineTimer = () => {
    if (!deadlineTimer) return;
    clearTimeout(deadlineTimer);
    deadlineTimer = null;
  };

  const stopCountdownAudio = () => {
    clearHeartbeatTicker();
    clearDeadlineTimer();
    stopHeartbeatLoop();
    activeDeadlineMs = 0;
  };

  const shiftTarget = (delta: number) => {
    if (targetCount <= 0) return;
    const next = (activeIndex + delta + targetCount) % targetCount;
    gameState.setInvestigationTarget(next);
  };

  const toggleDualMode = () => {
    const nextMode = $dualModeView === 'kira' ? 'l' : 'kira';
    gameState.dispatch({ type: 'APPLY_EFFECTS', effects: [{ type: 'flag.set', key: 'dual_mode', value: nextMode }] });
  };

  const setCause = (cause: DeathCause) => {
    if (countdownActive) return;
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
    stopCountdownAudio();
    playNotebookScribble();
    gameState.writeJudgment();
    notebookNameInput = '';
  };

  const primeName = () => {
    if (!canPrimeName) return;
    const deadlineMs = Date.now() + 40_000;
    gameState.primeJudgmentName(notebookNameInput, deadlineMs);
  };

  const handleNameInput = (event: Event) => {
    notebookNameInput = (event.currentTarget as HTMLInputElement).value;
    playInkScratch();
  };

  const handleDeadlineReached = () => {
    const now = Date.now();
    stopHeartbeatLoop();
    gameState.resolvePendingCauseTimeout(now);
    clearDeadlineTimer();
    clearHeartbeatTicker();
    activeDeadlineMs = 0;
  };

  $: {
    if (!countdownActive) {
      stopCountdownAudio();
    } else {
      const deadline = $pendingCauseCountdown?.deadlineMs ?? 0;
      if (deadline > 0 && deadline !== activeDeadlineMs) {
        activeDeadlineMs = deadline;
        nowMs = Date.now();
        clearHeartbeatTicker();
        clearDeadlineTimer();

        heartbeatTicker = setInterval(() => {
          nowMs = Date.now();
        }, 85);

        deadlineTimer = setTimeout(handleDeadlineReached, Math.max(0, deadline - nowMs));
        playHeartbeatLoop(deadline);
      }
    }
  }

  onDestroy(() => {
    stopCountdownAudio();
  });
</script>

<section class="intel-desk">
  <div class="desk-header">
    <h3>⌖ {$dualModeView === 'l' ? 'L MODE' : 'NOTE'}</h3>
    <span class="pages">PAGES {remainingPages}</span>
  </div>

  <div class="mode-tabs">
    <button type="button" class:active={deskMode === 'investigation'} on:click={() => (deskMode = 'investigation')}>
      INV
    </button>
    <button type="button" class:active={deskMode === 'writing'} on:click={() => (deskMode = 'writing')}>
      WRITE
    </button>
    <button type="button" class="swap" on:click={toggleDualMode}>
      {$dualModeView === 'l' ? 'KIRA' : 'L'}
    </button>
  </div>

  {#if activeTarget}
    <div class="target-row">
      <button type="button" class="mini" on:click={() => shiftTarget(-1)} disabled={targetCount <= 1}>◂</button>

      <div class="target-meta">
        <p class="target">
          T{activeIndex + 1}: {activeTarget.alias}
          {#if activeTarget.knownName}
            <span class="ink-name"> / {activeTarget.trueName}</span>
          {/if}
        </p>
        <p class="intel-state">
          <span class:ok={activeTarget.knownName}>N</span>
          <span class:ok={activeTarget.knownFace}>F</span>
          {#if activeTarget.isDecoy && !activeTarget.eliminated}
            <span class="decoy">?</span>
          {/if}
          {#if activeTarget.eliminated}
            <span class="dead">DONE</span>
          {/if}
        </p>
        {#if $gameState.flags.shinigami_eye_active === true && !activeTarget.knownName}
          <p class="eye-reveal">EYES: {activeTarget.trueName}</p>
        {/if}
      </div>

      <button type="button" class="mini" on:click={() => shiftTarget(1)} disabled={targetCount <= 1}>▸</button>
    </div>
  {/if}

  {#if $gameState.flags.shinigami_eye_active === true && eyeNameRows.length > 0}
    <div class="eye-panel">
      <p class="eye-label">SHINIGAMI EYES</p>
      {#each eyeNameRows as row}
        <p class="eye-row"><span>{row.alias}</span> <em>{row.trueName}</em></p>
      {/each}
    </div>
  {/if}

  {#if $dualModeView === 'l'}
    <div class="pane l-pane" in:fly={{ y: 2, duration: 120 }} out:fade={{ duration: 90 }}>
      <p class="hint">L is profiling block/region correlations and decoy responses.</p>
      <p class="lock">Suspicion spikes trigger interception at 85%+.</p>
      <div class="l-snapshot">
        {#if notebookEntries.length === 0}
          <p class="empty-log">No executions logged.</p>
        {:else}
          {#each notebookEntries as entry}
            <p class="log-entry {entry.decoy ? 'decoy-entry' : ''}">
              <span>{entry.trueName}</span>
              <em>{causeShortLabel(entry.cause)}</em>
            </p>
          {/each}
        {/if}
      </div>
    </div>
  {:else if deskMode === 'investigation'}
    <div class="pane" in:fly={{ y: 2, duration: 120 }} out:fade={{ duration: 90 }}>
      <div class="actions inv-grid">
        <button type="button" on:click={investigateName} disabled={!canInvestigateName}>Name</button>
        <button type="button" on:click={() => investigateFace('news-clip')} disabled={!canInvestigateNews}>News</button>
        <button type="button" on:click={() => investigateFace('social-feed')} disabled={!canInvestigateSocial}>Social</button>
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
    <div class="pane write-pane" in:fly={{ y: 2, duration: 120 }} out:fade={{ duration: 90 }}>
      <div class="actions cause-grid">
        {#each causeOptions as cause}
          <button
            type="button"
            class:selected={cause.id === selectedCause}
            title={cause.label}
            on:click={() => setCause(cause.id)}
            disabled={Boolean(countdownActive)}
          >
            {cause.short}
          </button>
        {/each}
      </div>

      <div class="name-row">
        <input
          type="text"
          value={notebookNameInput}
          on:input={handleNameInput}
          placeholder="True name"
          disabled={Boolean(countdownActive)}
        />
        <button type="button" class="prime" on:click={primeName} disabled={!canPrimeName}>INK</button>
      </div>

      <div class="ink-preview" class:ink-bleed={inkBleed} aria-live="polite">
        {#if inkPreview.length > 0}
          {#key inkDrawNonce}
            <svg class="ink-trace" viewBox="0 0 164 24" preserveAspectRatio="none">
              {#each inkPaths as stroke, i}
                <path
                  class="ink-path"
                  d={stroke.d}
                  style="stroke-width: {stroke.width}; animation-delay: {stroke.delay}ms"
                  in:draw={{ duration: 280 + i * 40, delay: stroke.delay }}
                />
              {/each}
            </svg>
          {/key}
          <p class="ink-preview-text">{inkPreview}</p>
        {:else}
          <p class="hint">Type with intent. Each stroke starts the 40-second rule.</p>
        {/if}
      </div>

      {#if countdownActive}
        <p class="timer">40s window: {secondsLeft}s left</p>
      {/if}

      <p class="cost">Intel {causeSpec.intel} | Will {causeSpec.willpower}</p>
      <button type="button" class="judgment" on:click={writeJudgment} disabled={!canWriteJudgment}>WRITE</button>
      <p class="lock">{notebookBlockReason}</p>

      <div class="notebook-log">
        <p class="log-head">Victims {notebookEntryCount}</p>
        {#if notebookEntries.length === 0}
          <p class="empty-log">No entries yet.</p>
        {:else}
          {#each notebookEntries as entry}
            <p class="log-entry {entry.decoy ? 'decoy-entry' : ''}">
              <span>{entry.trueName}</span>
              <em>{causeShortLabel(entry.cause)}</em>
            </p>
          {/each}
        {/if}
      </div>
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

  .desk-header {
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

  .pages {
    font-size: 4px;
    font-family: var(--font-pixel, monospace);
    color: #9a8470;
  }

  .mode-tabs {
    display: grid;
    grid-template-columns: 1fr 1fr 18px;
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

  .mode-tabs .swap {
    border-color: rgba(74, 141, 181, 0.3);
    color: #8bb5cc;
    background: linear-gradient(180deg, rgba(12, 22, 35, 0.95) 0%, rgba(8, 14, 24, 0.95) 100%);
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

  .ink-name {
    color: #d6c184;
    animation: scratch-ink 420ms ease-out;
    display: inline-block;
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

  .intel-state .decoy {
    color: #ba8f5a;
  }

  .eye-reveal {
    margin: 0;
    font-size: 4px;
    color: #d87a7a;
    letter-spacing: 0.2px;
    font-family: var(--font-pixel, monospace);
    text-shadow: 0 0 4px rgba(216, 122, 122, 0.25);
  }

  .eye-panel {
    border: 1px solid rgba(200, 40, 40, 0.2);
    background: linear-gradient(180deg, rgba(40, 8, 8, 0.8), rgba(20, 5, 5, 0.82));
    padding: 2px;
    display: grid;
    gap: 1px;
  }

  .eye-label {
    margin: 0;
    font-size: 4px;
    color: #c96969;
    letter-spacing: 0.2px;
    font-family: var(--font-pixel, monospace);
  }

  .eye-row {
    margin: 0;
    display: flex;
    justify-content: space-between;
    gap: 3px;
    font-size: 4px;
    color: #b28e8e;
    font-family: var(--font-pixel, monospace);
  }

  .eye-row em {
    color: #e08f8f;
    font-style: normal;
  }

  .pane {
    display: grid;
    gap: 2px;
    padding: 2px;
    border: 1px solid rgba(200, 0, 0, 0.14);
    background: rgba(14, 7, 9, 0.86);
  }

  .l-pane {
    border-color: rgba(74, 141, 181, 0.22);
    background: linear-gradient(180deg, rgba(10, 18, 26, 0.9), rgba(9, 13, 18, 0.9));
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
  .mini:hover:not(:disabled),
  .prime:hover:not(:disabled) {
    border-color: rgba(200, 0, 0, 0.35);
    color: #d8c1c1;
  }

  .write-pane {
    gap: 3px;
  }

  .name-row {
    display: grid;
    grid-template-columns: minmax(0, 1fr) 18px;
    gap: 1px;
  }

  .name-row input {
    min-width: 0;
    border: 1px solid rgba(190, 160, 110, 0.26);
    background: rgba(24, 18, 10, 0.9);
    color: #dac497;
    padding: 1px 2px;
    font-size: 4px;
    font-family: var(--font-vt, monospace);
    text-transform: uppercase;
    letter-spacing: 0.15px;
    text-shadow: 0 0 3px rgba(218, 196, 151, 0.2);
  }

  .name-row input::placeholder {
    color: #8f7b57;
  }

  .ink-preview {
    position: relative;
    min-height: 18px;
    border: 1px solid rgba(190, 160, 110, 0.23);
    background:
      linear-gradient(180deg, rgba(30, 22, 14, 0.92) 0%, rgba(18, 13, 9, 0.92) 100%),
      repeating-linear-gradient(180deg, transparent 0 3px, rgba(140, 110, 70, 0.08) 3px 4px);
    padding: 2px 3px;
    overflow: hidden;
    transition: box-shadow 400ms ease;
  }

  .ink-preview.ink-bleed {
    box-shadow:
      inset 0 0 8px rgba(31, 20, 13, 0.15),
      inset 0 0 3px rgba(120, 80, 40, 0.1);
  }

  .ink-trace {
    position: absolute;
    inset: 0;
    width: 100%;
    height: 100%;
    pointer-events: none;
    filter: url(#ink-turbulence);
  }

  .ink-path {
    fill: none;
    stroke: rgba(31, 20, 13, 0.85);
    stroke-linecap: round;
    stroke-linejoin: round;
    filter: drop-shadow(0 0 0.5px rgba(20, 10, 5, 0.3));
  }

  .ink-bleed .ink-path {
    stroke: rgba(26, 16, 10, 0.75);
    filter: drop-shadow(0 0.5px 1px rgba(20, 10, 5, 0.2));
    transition: stroke 300ms ease, filter 500ms ease;
  }

  .ink-preview-text {
    margin: 0;
    position: relative;
    z-index: 1;
    font-size: 7px;
    font-family: var(--font-death-note, serif);
    letter-spacing: 0.2px;
    color: #1b120d;
    text-shadow: 0.5px 0.5px 0 rgba(0, 0, 0, 0.24);
    animation: ink-write 360ms ease-out;
  }

  .ink-bleed .ink-preview-text {
    text-shadow:
      0.5px 0.5px 0 rgba(0, 0, 0, 0.24),
      0 0 2px rgba(31, 20, 13, 0.15);
  }

  .prime,
  .judgment {
    border: 1px solid rgba(196, 164, 74, 0.24);
    background: linear-gradient(180deg, rgba(28, 22, 11, 0.95) 0%, rgba(14, 11, 6, 0.95) 100%);
    color: #b8a471;
    font-size: 4px;
    font-family: var(--font-pixel, monospace);
    cursor: pointer;
  }

  .prime {
    padding: 1px 2px;
  }

  .judgment {
    padding: 2px 3px;
    text-transform: uppercase;
    letter-spacing: 0.6px;
  }

  .cost {
    margin: 0;
    font-size: 4px;
    color: #a78e68;
    font-family: var(--font-pixel, monospace);
  }

  .timer {
    margin: 0;
    font-size: 4px;
    color: #d27a7a;
    font-family: var(--font-pixel, monospace);
    letter-spacing: 0.2px;
    text-transform: uppercase;
    animation: timer-pulse 420ms steps(2, end) infinite;
  }

  .notebook-log,
  .l-snapshot {
    border: 1px solid rgba(190, 160, 110, 0.2);
    background: rgba(16, 10, 7, 0.72);
    padding: 2px;
    display: grid;
    gap: 1px;
  }

  .l-snapshot {
    border-color: rgba(74, 141, 181, 0.2);
    background: rgba(9, 15, 20, 0.7);
  }

  .log-head {
    margin: 0;
    font-size: 4px;
    font-family: var(--font-pixel, monospace);
    color: #a78e68;
  }

  .log-entry {
    margin: 0;
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: 3px;
    font-size: 4px;
    color: #b79f82;
    font-family: var(--font-pixel, monospace);
  }

  .log-entry.decoy-entry {
    color: #ce8d8d;
  }

  .log-entry em {
    font-style: normal;
    color: #8f7f66;
  }

  .empty-log {
    margin: 0;
    font-size: 4px;
    color: #605858;
    font-family: var(--font-pixel, monospace);
  }

  button:disabled {
    opacity: 0.36;
    cursor: not-allowed;
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

  @keyframes scratch-ink {
    from {
      opacity: 0;
      clip-path: inset(0 100% 0 0);
      transform: translateX(-2px);
    }
    to {
      opacity: 1;
      clip-path: inset(0 0 0 0);
      transform: translateX(0);
    }
  }

  @keyframes ink-write {
    from {
      clip-path: inset(0 100% 0 0);
      opacity: 0.4;
      transform: translateX(-1px);
    }
    to {
      clip-path: inset(0 0 0 0);
      opacity: 1;
      transform: translateX(0);
    }
  }

  @keyframes timer-pulse {
    0%,
    49% {
      opacity: 1;
    }
    50%,
    100% {
      opacity: 0.5;
    }
  }
</style>
