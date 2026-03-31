<script lang="ts">
  import { onDestroy, onMount } from 'svelte';
  import { worldTimeline } from '$lib/stores/timeline';
  import { gameState } from '$lib/stores/gameState';

  const toneClass = (tone: string): string => {
    if (tone === 'critical') return 'critical';
    if (tone === 'danger') return 'danger';
    if (tone === 'urgent') return 'urgent';
    return 'neutral';
  };

  // Track eliminations for breaking news flash
  let breakingFlash = false;
  let breakingText = '';
  let lastLogCount = 0;
  let flashTimer: ReturnType<typeof setTimeout> | null = null;

  // Dynamic scroll speed based on urgency
  let scrollDuration = 34;

  const clearFlash = () => {
    if (flashTimer) {
      clearTimeout(flashTimer);
      flashTimer = null;
    }
  };

  const unsubscribe = gameState.subscribe((state) => {
    const logCount = state.investigation.eliminationLog.length;
    
    // Trigger breaking news on new elimination
    if (logCount > lastLogCount && lastLogCount > 0) {
      const latest = state.investigation.eliminationLog[logCount - 1];
      if (latest) {
        breakingText = `SUSPECT ${latest.alias.toUpperCase()} FOUND DEAD`;
        breakingFlash = true;
        clearFlash();
        flashTimer = setTimeout(() => {
          breakingFlash = false;
          breakingText = '';
        }, 3200);
      }
    }
    lastLogCount = logCount;

    // Adjust scroll speed based on suspicion
    if (state.suspicion.meter >= 85) {
      scrollDuration = 16;
    } else if (state.suspicion.meter >= 60) {
      scrollDuration = 22;
    } else if (state.suspicion.meter >= 40) {
      scrollDuration = 28;
    } else {
      scrollDuration = 34;
    }
  });

  onMount(() => {
    lastLogCount = 0;
    // Initialize from current state
    const state = $gameState;
    lastLogCount = state.investigation.eliminationLog.length;
  });

  onDestroy(() => {
    unsubscribe();
    clearFlash();
  });
</script>

<section class="ticker" class:breaking={breakingFlash} aria-label="World timeline ticker">
  {#if breakingFlash}
    <div class="breaking-bar">
      <span class="breaking-label">▌BREAKING</span>
      <span class="breaking-text">{breakingText}</span>
    </div>
  {:else}
    <div class="track">
      <div class="loop" style="animation-duration: {scrollDuration}s">
        {#each [...$worldTimeline, ...$worldTimeline] as entry}
          <span class="item {toneClass(entry.tone)}">
            <strong>{entry.headline}</strong>
            <span>{entry.detail}</span>
          </span>
        {/each}
      </div>
    </div>
  {/if}
</section>

<style>
  .ticker {
    height: 10px;
    border-top: 1px solid rgba(200, 0, 0, 0.22);
    border-bottom: 1px solid rgba(200, 0, 0, 0.12);
    background: linear-gradient(180deg, rgba(15, 7, 9, 0.96) 0%, rgba(10, 5, 7, 0.96) 100%);
    overflow: hidden;
    flex-shrink: 0;
    position: relative;
    transition: background 300ms ease;
  }

  .ticker.breaking {
    background: linear-gradient(180deg, rgba(40, 8, 8, 0.98) 0%, rgba(28, 5, 5, 0.98) 100%);
    border-top-color: rgba(255, 40, 40, 0.45);
    border-bottom-color: rgba(255, 40, 40, 0.25);
    animation: breaking-pulse 400ms steps(2, end) infinite;
  }

  .track {
    width: 100%;
    height: 100%;
    overflow: hidden;
  }

  .loop {
    min-width: max-content;
    height: 100%;
    display: inline-flex;
    align-items: center;
    gap: 14px;
    padding: 0 10px;
    animation: ticker-scroll linear infinite;
  }

  .item {
    display: inline-flex;
    align-items: center;
    gap: 3px;
    font-family: var(--font-pixel, monospace);
    font-size: 4px;
    letter-spacing: 0.2px;
    white-space: nowrap;
    text-transform: uppercase;
    color: #847777;
  }

  .item strong {
    font-weight: 400;
    color: #b89898;
  }

  .item.urgent {
    color: #a5846c;
  }

  .item.danger {
    color: #bf7272;
  }

  .item.critical {
    color: #e05f5f;
  }

  /* Breaking news bar */
  .breaking-bar {
    width: 100%;
    height: 100%;
    display: flex;
    align-items: center;
    gap: 6px;
    padding: 0 6px;
    animation: flash-slide 600ms ease-out;
  }

  .breaking-label {
    font-family: var(--font-pixel, monospace);
    font-size: 4px;
    color: #ff4444;
    letter-spacing: 0.5px;
    text-transform: uppercase;
    flex-shrink: 0;
    animation: blink-label 500ms steps(2, end) infinite;
  }

  .breaking-text {
    font-family: var(--font-pixel, monospace);
    font-size: 4px;
    color: #e8c8c8;
    letter-spacing: 0.3px;
    text-transform: uppercase;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    text-shadow: 0 0 4px rgba(255, 60, 60, 0.3);
    animation: text-reveal 800ms steps(20, end);
  }

  @keyframes ticker-scroll {
    from {
      transform: translateX(0);
    }
    to {
      transform: translateX(-50%);
    }
  }

  @keyframes breaking-pulse {
    0%, 100% {
      box-shadow: inset 0 0 4px rgba(255, 0, 0, 0.15);
    }
    50% {
      box-shadow: inset 0 0 8px rgba(255, 0, 0, 0.3);
    }
  }

  @keyframes flash-slide {
    0% {
      opacity: 0;
      transform: translateX(-10px);
    }
    30% {
      opacity: 1;
    }
    100% {
      transform: translateX(0);
    }
  }

  @keyframes blink-label {
    0%, 49% { opacity: 1; }
    50%, 100% { opacity: 0.3; }
  }

  @keyframes text-reveal {
    0% {
      clip-path: inset(0 100% 0 0);
    }
    100% {
      clip-path: inset(0 0 0 0);
    }
  }
</style>
