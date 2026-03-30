<script lang="ts">
  import { browser } from '$app/environment';
  import { goto } from '$app/navigation';
  import { onMount } from 'svelte';

  import GBAFrame from '$lib/components/shell/GBAFrame.svelte';
  import GBAScreen from '$lib/components/shell/GBAScreen.svelte';

  import TopBar from '$lib/components/hud/TopBar.svelte';
  import CanonTimelineBar from '$lib/components/hud/CanonTimelineBar.svelte';
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

  import { gameState } from '$lib/stores/gameState';
  import { isGameOver, phase } from '$lib/stores/selectors';

  let redirectingToTitle = false;

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

  onMount(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.repeat || $gameState.phase === 'game-over') {
        return;
      }

      if (event.key === 'Escape' || event.key.toLowerCase() === 'p') {
        togglePause();
      }
    };

    window.addEventListener('keydown', onKeyDown);
    return () => {
      window.removeEventListener('keydown', onKeyDown);
    };
  });
</script>

<main class="game-page">
  <GBAFrame title="Death Note Gameplay">
    <GBAScreen>
      <section class="game-screen">
        <TopBar />
        <CanonTimelineBar />

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
            <CanonTracker />
            <LogPanel />
            <button type="button" class="pause-btn" on:click={togglePause}>
              ⏸ MENU
            </button>
          </aside>
        </div>

        {#if $gameState.phase === 'paused'}
          <PauseMenu />
        {/if}

        {#if $isGameOver}
          <GameOverModal />
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
</style>
