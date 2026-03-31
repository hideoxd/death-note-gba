<script lang="ts">
  import { browser } from '$app/environment';
  import { goto } from '$app/navigation';
  import { onDestroy, onMount } from 'svelte';
  import { fade } from 'svelte/transition';

import GBAFrame from '$lib/components/shell/GBAFrame.svelte';
import GBAScreen from '$lib/components/shell/GBAScreen.svelte';

  import TopBar from '$lib/components/hud/TopBar.svelte';
  import CanonTimelineBar from '$lib/components/hud/CanonTimelineBar.svelte';
  import WorldTicker from '$lib/components/hud/WorldTicker.svelte';
  import PatternTerminal from '$lib/components/hud/PatternTerminal.svelte';
  import TimeBlockPanel from '$lib/components/hud/TimeBlockPanel.svelte';
  import StatPanel from '$lib/components/hud/StatPanel.svelte';
  import SuspicionMeter from '$lib/components/hud/SuspicionMeter.svelte';
  import WorldOpinion from '$lib/components/hud/WorldOpinion.svelte';

  import SceneViewport from '$lib/components/narrative/SceneViewport.svelte';
  import ActivityGrid from '$lib/components/grind/ActivityGrid.svelte';
  import IntelDesk from '$lib/components/grind/IntelDesk.svelte';
  import CanonTracker from '$lib/components/canon/CanonTracker.svelte';

  import PauseMenu from '$lib/components/system/PauseMenu.svelte';
  import GameOverModal from '$lib/components/system/GameOverModal.svelte';
  import LogPanel from '$lib/components/system/LogPanel.svelte';
  import RulebookOverlay from '$lib/components/system/RulebookOverlay.svelte';
  import StartupOverlay from '$lib/components/system/StartupOverlay.svelte';

  import { gameState } from '$lib/stores/gameState';
  import { uiState } from '$lib/stores/uiState';
  import { dualModeView, isGameOver, phase, shinigamiEyeActive } from '$lib/stores/selectors';
  import { playHeartbeatThud, playLInterventionVoice } from '$lib/utils/sfx';

  let redirectingToTitle = false;
  let showRulebook = false;
  let pressedStart = false;
  let pressedSelect = false;
  let pressedA = false;
  let pressedB = false;
  let pressedUp = false;
  let pressedDown = false;
  let pressedLeft = false;
  let pressedRight = false;
  let deathFlashActive = false;
  let lGlitchVisible = false;
  let lGlitchReason = '';

  let deathFlashTimer: ReturnType<typeof setTimeout> | null = null;
  let lGlitchTimer: ReturnType<typeof setTimeout> | null = null;
  let previousAlertSeq = 0;
  let previousDeathFlashSeq = 0;
  let previousSuspicionMeter = 0;

  $: if (browser && $phase === 'title' && !redirectingToTitle) {
    redirectingToTitle = true;
    void goto('/');
  }

  const togglePause = () => {
    if ($gameState.phase === 'game-over') {
      return;
    }

    if ($gameState.phase === 'paused') {
      gameState.setPhase('playing');
    } else if ($gameState.phase === 'playing') {
      gameState.setPhase('paused');
    }
  };

  const triggerStart = () => {
    togglePause();
  };

  const triggerA = () => {
    if ($gameState.phase === 'playing') {
      gameState.writeJudgment();
    }
  };

  const triggerB = () => {
    if ($gameState.phase === 'playing') {
      gameState.advanceTime(1);
    }
  };

  const shiftInvestigationTarget = (delta: number) => {
    if ($gameState.phase !== 'playing') {
      return;
    }

    const total = $gameState.investigation.targets.length;
    if (total <= 1) {
      return;
    }

    const current = Math.max(0, Math.min($gameState.investigation.activeTargetIndex, total - 1));
    const next = (current + delta + total) % total;
    gameState.setInvestigationTarget(next);
  };

  const setDualMode = (mode: 'kira' | 'l') => {
    if ($gameState.phase === 'game-over' || $dualModeView === mode) {
      return;
    }

    gameState.dispatch({
      type: 'APPLY_EFFECTS',
      effects: [{ type: 'flag.set', key: 'dual_mode', value: mode }]
    });
  };

  const triggerUp = () => {
    shiftInvestigationTarget(-1);
  };

  const triggerDown = () => {
    shiftInvestigationTarget(1);
  };

  const triggerLeft = () => {
    setDualMode('kira');
  };

  const triggerRight = () => {
    setDualMode('l');
  };

  const triggerSelect = () => {
    if ($gameState.phase === 'paused') {
      showRulebook = !showRulebook;
      return;
    }

    if ($gameState.phase === 'playing') {
      gameState.toggleShinigamiEye();
    }
  };

  const closeRulebook = () => {
    showRulebook = false;
  };

  const clearButtonStates = () => {
    pressedStart = false;
    pressedSelect = false;
    pressedA = false;
    pressedB = false;
    pressedUp = false;
    pressedDown = false;
    pressedLeft = false;
    pressedRight = false;
  };

  const clearDeathFlashTimer = () => {
    if (!deathFlashTimer) {
      return;
    }

    clearTimeout(deathFlashTimer);
    deathFlashTimer = null;
  };

  const clearLGlitchTimer = () => {
    if (!lGlitchTimer) {
      return;
    }

    clearTimeout(lGlitchTimer);
    lGlitchTimer = null;
  };

  const triggerDeathFlash = () => {
    deathFlashActive = true;
    clearDeathFlashTimer();
    deathFlashTimer = setTimeout(() => {
      deathFlashActive = false;
    }, 420);
  };

  const triggerLGlitch = (reason: string) => {
    lGlitchReason = reason;
    lGlitchVisible = true;
    playLInterventionVoice();
    clearLGlitchTimer();
    lGlitchTimer = setTimeout(() => {
      lGlitchVisible = false;
      lGlitchReason = '';
    }, 2100);
  };

  const formatGlitchReason = (reason: string): string => {
    if (!reason) {
      return 'PROFILE MATCH';
    }

    return reason.replace(/_/g, ' ').toUpperCase();
  };

  onMount(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      const key = event.key.toLowerCase();

      const target = event.target as HTMLElement | null;
      const isTypingTarget = Boolean(
        target &&
          (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable)
      );

      if (isTypingTarget) {
        return;
      }

      if (key === 'enter') {
        pressedStart = true;
      } else if (key === 'shift') {
        pressedSelect = true;
      } else if (key === 'z') {
        pressedA = true;
      } else if (key === 'x') {
        pressedB = true;
      } else if (key === 'arrowup') {
        pressedUp = true;
      } else if (key === 'arrowdown') {
        pressedDown = true;
      } else if (key === 'arrowleft') {
        pressedLeft = true;
      } else if (key === 'arrowright') {
        pressedRight = true;
      }

      if (event.repeat || $gameState.phase === 'game-over') {
        return;
      }

      if (event.key === 'Escape' || key === 'p') {
        togglePause();
        return;
      }

      if (event.key === 'Enter') {
        event.preventDefault();
        triggerStart();
        return;
      }

      if (key === 'z') {
        event.preventDefault();
        triggerA();
        return;
      }

      if (key === 'x') {
        event.preventDefault();
        triggerB();
        return;
      }

      if (event.key === 'Shift') {
        event.preventDefault();
        triggerSelect();
        return;
      }

      if (key === 'arrowup') {
        event.preventDefault();
        triggerUp();
        return;
      }

      if (key === 'arrowdown') {
        event.preventDefault();
        triggerDown();
        return;
      }

      if (key === 'arrowleft') {
        event.preventDefault();
        triggerLeft();
        return;
      }

      if (key === 'arrowright') {
        event.preventDefault();
        triggerRight();
        return;
      }
    };

    const onKeyUp = (event: KeyboardEvent) => {
      const key = event.key.toLowerCase();

      if (key === 'enter') {
        pressedStart = false;
      } else if (key === 'shift') {
        pressedSelect = false;
      } else if (key === 'z') {
        pressedA = false;
      } else if (key === 'x') {
        pressedB = false;
      } else if (key === 'arrowup') {
        pressedUp = false;
      } else if (key === 'arrowdown') {
        pressedDown = false;
      } else if (key === 'arrowleft') {
        pressedLeft = false;
      } else if (key === 'arrowright') {
        pressedRight = false;
      }
    };

    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('keyup', onKeyUp);
    window.addEventListener('blur', clearButtonStates);

    const body = document.body;
    const unsubscribe = gameState.subscribe((state) => {
      body.classList.toggle('phase-l-alert', state.suspicion.meter >= 60 && state.suspicion.meter < 85);
      body.classList.toggle('phase-l-critical', state.suspicion.meter >= 85);
      body.classList.toggle('shinigami-eye', state.flags.shinigami_eye_active === true);

      if (state.suspicion.meter >= 85 && previousSuspicionMeter < 85) {
        triggerLGlitch('suspicion threshold');
      }
      previousSuspicionMeter = state.suspicion.meter;

      const alertSeq = typeof state.flags.suspicion_alert_seq === 'number' ? Math.max(0, state.flags.suspicion_alert_seq) : 0;
      if (alertSeq > previousAlertSeq) {
        previousAlertSeq = alertSeq;
        const reason = typeof state.flags.suspicion_alert_reason === 'string' ? state.flags.suspicion_alert_reason : '';
        triggerLGlitch(reason);
      }

      const deathSeq = typeof state.flags.death_flash_seq === 'number' ? Math.max(0, state.flags.death_flash_seq) : 0;
      if (deathSeq > previousDeathFlashSeq) {
        previousDeathFlashSeq = deathSeq;
        playHeartbeatThud();
        triggerDeathFlash();
      }
    });

    return () => {
      unsubscribe();
      document.body.classList.remove('phase-l-alert', 'phase-l-critical', 'shinigami-eye');
      window.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('keyup', onKeyUp);
      window.removeEventListener('blur', clearButtonStates);
      clearButtonStates();
    };
  });

  onDestroy(() => {
    clearDeathFlashTimer();
    clearLGlitchTimer();
  });
</script>

<main class="game-page">
  <GBAFrame
    title="Death Note Gameplay"
    pressedStart={pressedStart}
    pressedSelect={pressedSelect}
    pressedA={pressedA}
    pressedB={pressedB}
    pressedUp={pressedUp}
    pressedDown={pressedDown}
    pressedLeft={pressedLeft}
    pressedRight={pressedRight}
    on:start={triggerStart}
    on:select={triggerSelect}
    on:a={triggerA}
    on:b={triggerB}
    on:up={triggerUp}
    on:down={triggerDown}
    on:left={triggerLeft}
    on:right={triggerRight}
  >
    <GBAScreen glitchActive={deathFlashActive || lGlitchVisible}>
      <section class="game-screen">
        <TopBar />
        <CanonTimelineBar />
        <WorldTicker />

        <div class="layout-grid">
          <section class="left-column">
            <SceneViewport />
            <ActivityGrid />
          </section>

          <aside class="right-column">
            <TimeBlockPanel />
            <StatPanel />
            <SuspicionMeter />
            <WorldOpinion />
            <IntelDesk />
            {#if $dualModeView === 'l'}
              <PatternTerminal />
            {/if}
            <CanonTracker />
            {#if $shinigamiEyeActive}
              <div class="eye-indicator">EYE ON</div>
            {/if}
            {#if $uiState.showLogPanel}
              <div in:fade={{ duration: 120 }} out:fade={{ duration: 90 }}>
                <LogPanel />
              </div>
            {/if}
            <button type="button" class="pause-btn" on:click={togglePause}>
              ⏸ MENU
            </button>
          </aside>
        </div>

        {#if $gameState.phase === 'paused'}
          <PauseMenu />
          <RulebookOverlay open={showRulebook} onClose={closeRulebook} />
        {/if}

        {#if $isGameOver}
          <GameOverModal />
        {/if}

        <StartupOverlay />

        {#if deathFlashActive}
          <div class="death-flash" aria-hidden="true"></div>
        {/if}

        {#if lGlitchVisible}
          <div class="l-intervention" aria-live="assertive">
            <div class="l-card">
              <span class="glyph">L</span>
              <span class="line">I'VE FOUND YOU.</span>
              <span class="reason">{formatGlitchReason(lGlitchReason)}</span>
            </div>
          </div>
        {/if}
      </section>
    </GBAScreen>
  </GBAFrame>
</main>

<style>
  .game-page {
    min-height: 100svh;
    width: 100%;
    display: grid;
    place-items: center;
    padding: clamp(8px, 2vw, 16px);
  }

  .game-screen {
    width: 240px;
    height: 160px;
    display: flex;
    flex-direction: column;
    position: relative;
    overflow: hidden;
  }

  .layout-grid {
    display: grid;
    grid-template-columns: minmax(0, 1fr) 64px;
    grid-template-rows: minmax(0, 1fr);
    gap: 2px;
    padding: 2px;
    flex: 1;
    min-height: 0;
    overflow: hidden;
    align-items: stretch;
  }

  .left-column {
    display: flex;
    flex-direction: column;
    gap: 2px;
    height: 100%;
    min-height: 0;
    min-width: 0;
    overflow-y: auto;
    overflow-x: hidden;
    -webkit-overflow-scrolling: touch;
    scrollbar-width: none;
    -ms-overflow-style: none;
  }

  .left-column::-webkit-scrollbar {
    display: none;
  }

  .left-column > :global(*) {
    width: 100%;
  }

  .right-column {
    display: flex;
    flex-direction: column;
    gap: 2px;
    height: 100%;
    min-height: 0;
    min-width: 0;
    max-width: 64px;
    overflow-y: auto;
    overflow-x: hidden;
    -webkit-overflow-scrolling: touch;
    scrollbar-width: none;
    -ms-overflow-style: none;
  }

  .right-column::-webkit-scrollbar {
    display: none;
  }

  .right-column > :global(*) {
    width: 100%;
  }

  .pause-btn {
    width: 100%;
    display: flex;
    align-items: center;
    justify-content: center;
    border: 1px solid rgba(200, 0, 0, 0.2);
    background: linear-gradient(180deg, rgba(25, 10, 12, 0.95) 0%, rgba(15, 6, 8, 0.95) 100%);
    color: #908080;
    padding: 2px 4px;
    font-size: 5px;
    font-family: var(--font-pixel, monospace);
    text-transform: uppercase;
    cursor: pointer;
    letter-spacing: 0.5px;
    transition: all 150ms;
    border-radius: 1px;
    flex-shrink: 0;
  }

  .pause-btn:hover {
    background: linear-gradient(180deg, rgba(45, 15, 15, 0.95) 0%, rgba(28, 8, 8, 0.95) 100%);
    border-color: rgba(200, 0, 0, 0.4);
    color: #c0b0b0;
  }

  .eye-indicator {
    border: 1px solid rgba(210, 60, 60, 0.34);
    background: linear-gradient(180deg, rgba(48, 9, 15, 0.9) 0%, rgba(24, 5, 9, 0.9) 100%);
    color: #e17a7a;
    padding: 1px 2px;
    font-size: 4px;
    font-family: var(--font-pixel, monospace);
    letter-spacing: 0.4px;
    text-transform: uppercase;
    text-align: center;
    animation: eye-blink 520ms steps(2, end) infinite;
  }

  @keyframes eye-blink {
    0%,
    49% {
      opacity: 1;
    }
    50%,
    100% {
      opacity: 0.45;
    }
  }

  .death-flash {
    position: absolute;
    inset: 0;
    pointer-events: none;
    z-index: 45;
    background:
      radial-gradient(circle at 50% 50%, rgba(255, 80, 80, 0.34) 0%, rgba(160, 0, 0, 0.46) 42%, rgba(20, 0, 0, 0.72) 100%),
      repeating-linear-gradient(180deg, rgba(255, 0, 0, 0.08) 0 1px, rgba(0, 0, 0, 0.15) 1px 2px);
    animation: death-flash 420ms ease-out;
  }

  .l-intervention {
    position: absolute;
    inset: 0;
    z-index: 46;
    display: grid;
    place-items: center;
    pointer-events: none;
    background: radial-gradient(circle at 50% 50%, rgba(40, 20, 20, 0.12), rgba(10, 4, 6, 0.72));
    animation: l-overlay 2100ms steps(2, end);
  }

  .l-card {
    width: 134px;
    border: 1px solid rgba(210, 80, 80, 0.42);
    background: linear-gradient(180deg, rgba(20, 7, 9, 0.94), rgba(8, 4, 6, 0.95));
    box-shadow:
      0 0 10px rgba(200, 0, 0, 0.26),
      inset 0 0 10px rgba(0, 0, 0, 0.7);
    padding: 6px 8px;
    display: grid;
    gap: 2px;
    justify-items: center;
    text-align: center;
    animation: l-card-glitch 320ms steps(2, end) infinite;
  }

  .glyph {
    font-family: var(--font-death-note, serif);
    font-size: 22px;
    color: #e2cbcb;
    line-height: 1;
    text-shadow:
      -1px 0 rgba(255, 0, 0, 0.45),
      1px 0 rgba(80, 160, 220, 0.35),
      0 0 8px rgba(200, 0, 0, 0.25);
  }

  .line {
    font-family: var(--font-pixel, monospace);
    font-size: 6px;
    letter-spacing: 0.6px;
    color: #d9a8a8;
    text-transform: uppercase;
  }

  .reason {
    font-family: var(--font-pixel, monospace);
    font-size: 4px;
    color: #8e8282;
    letter-spacing: 0.3px;
  }

  @keyframes death-flash {
    0% {
      opacity: 0;
      transform: scale(1.01);
    }
    28% {
      opacity: 1;
      transform: scale(1);
    }
    100% {
      opacity: 0;
      transform: scale(1);
    }
  }

  @keyframes l-card-glitch {
    0%,
    100% {
      transform: translate(0, 0);
    }
    33% {
      transform: translate(-0.8px, 0.5px);
    }
    66% {
      transform: translate(0.9px, -0.5px);
    }
  }

  @keyframes l-overlay {
    0%,
    100% {
      opacity: 0;
    }
    6%,
    94% {
      opacity: 1;
    }
  }
</style>
