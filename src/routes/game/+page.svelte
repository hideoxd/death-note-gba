<script lang="ts">
  import { browser } from '$app/environment';
  import { goto } from '$app/navigation';
  import { onMount } from 'svelte';
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

  let redirectingToTitle = false;
  let showRulebook = false;

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

  const triggerSelect = () => {
    if ($gameState.phase === 'paused') {
      showRulebook = !showRulebook;
      return;
    }

    const nextMode = $dualModeView === 'kira' ? 'l' : 'kira';
    gameState.dispatch({ type: 'APPLY_EFFECTS', effects: [{ type: 'flag.set', key: 'dual_mode', value: nextMode }] });
  };

  const closeRulebook = () => {
    showRulebook = false;
  };

  onMount(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.repeat || $gameState.phase === 'game-over') {
        return;
      }

      if (event.key === 'Escape' || event.key.toLowerCase() === 'p') {
        togglePause();
        return;
      }

      if (event.key === 'Enter') {
        event.preventDefault();
        triggerStart();
        return;
      }

      if (event.key.toLowerCase() === 'z') {
        event.preventDefault();
        triggerA();
        return;
      }

      if (event.key.toLowerCase() === 'x') {
        event.preventDefault();
        triggerB();
        return;
      }

      if (event.key === 'Shift') {
        event.preventDefault();
        triggerSelect();
        return;
      }

      if (event.key.toLowerCase() === 's' && event.ctrlKey && event.altKey) {
        event.preventDefault();
        gameState.toggleShinigamiEye();
        return;
      }

      if (event.key.toLowerCase() === 'l' && event.ctrlKey && event.altKey) {
        event.preventDefault();
        gameState.toggleShinigamiEye();
      }
    };

    window.addEventListener('keydown', onKeyDown);

    const body = document.body;
    const unsubscribe = gameState.subscribe((state) => {
      body.classList.toggle('phase-l-alert', state.suspicion.meter >= 60 && state.suspicion.meter < 85);
      body.classList.toggle('phase-l-critical', state.suspicion.meter >= 85);
      body.classList.toggle('shinigami-eye', state.flags.shinigami_eye_active === true);
    });

    return () => {
      unsubscribe();
      document.body.classList.remove('phase-l-alert', 'phase-l-critical', 'shinigami-eye');
      window.removeEventListener('keydown', onKeyDown);
    };
  });
</script>

<main class="game-page">
  <GBAFrame title="Death Note Gameplay" on:start={triggerStart} on:select={triggerSelect} on:a={triggerA} on:b={triggerB}>
    <GBAScreen>
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
</style>
