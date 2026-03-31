<script lang="ts">
  import { onMount } from 'svelte';
  import { goto } from '$app/navigation';
  import GBAFrame from '$lib/components/shell/GBAFrame.svelte';
  import GBAScreen from '$lib/components/shell/GBAScreen.svelte';
  import { gameState } from '$lib/stores/gameState';
  import { hasSnapshot } from '$lib/stores/persistence';

  let canContinue = false;
  let showMenu = false;
  let showRules = false;
  let pressedStart = false;
  let pressedSelect = false;
  let pressedA = false;
  let pressedB = false;
  let pressedUp = false;
  let pressedDown = false;
  let pressedLeft = false;
  let pressedRight = false;
  let selectedMenuIndex = 0;
  let transitionLocked = false;

  const clearPressed = () => {
    pressedStart = false;
    pressedSelect = false;
    pressedA = false;
    pressedB = false;
    pressedUp = false;
    pressedDown = false;
    pressedLeft = false;
    pressedRight = false;
  };

  $: menuOrder = canContinue
    ? ['continue', 'clear', 'anime-canon', 'divergent', 'help']
    : ['anime-canon', 'divergent', 'help'];

  $: if (selectedMenuIndex >= menuOrder.length) {
    selectedMenuIndex = Math.max(0, menuOrder.length - 1);
  }

  const isSelected = (id: string) => menuOrder[selectedMenuIndex] === id;

  const setSelectedById = (id: string) => {
    const index = menuOrder.indexOf(id);
    if (index !== -1) {
      selectedMenuIndex = index;
    }
  };

  const moveMenuSelection = (delta: number) => {
    if (!showMenu || showRules || menuOrder.length === 0) {
      return;
    }

    selectedMenuIndex = (selectedMenuIndex + delta + menuOrder.length) % menuOrder.length;
  };

  onMount(() => {
    canContinue = hasSnapshot();
    selectedMenuIndex = canContinue ? 0 : 0;
    const timer = window.setTimeout(() => {
      showMenu = true;
    }, 800);

    const onKeyDown = (event: KeyboardEvent) => {
      const key = event.key.toLowerCase();

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

      if (event.repeat) return;

      if (key === 'arrowup') {
        event.preventDefault();
        moveMenuSelection(-1);
        return;
      }

      if (key === 'arrowdown') {
        event.preventDefault();
        moveMenuSelection(1);
        return;
      }

      if (key === 'arrowleft') {
        event.preventDefault();
        moveMenuSelection(-1);
        return;
      }

      if (key === 'arrowright') {
        event.preventDefault();
        moveMenuSelection(1);
        return;
      }

      if (event.key === 'Enter') {
        event.preventDefault();
        void activateSelectedMenu();
        return;
      }

      if (key === 'z') {
        event.preventDefault();
        void activateSelectedMenu();
        return;
      }

      if (event.key === 'Shift' || key === 'x') {
        event.preventDefault();
        showRules = !showRules;
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
    window.addEventListener('blur', clearPressed);

    return () => {
      window.clearTimeout(timer);
      window.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('keyup', onKeyUp);
      window.removeEventListener('blur', clearPressed);
      clearPressed();
    };
  });

  const start = async (mode: 'anime-canon' | 'divergent') => {
    if (transitionLocked) {
      return;
    }

    transitionLocked = true;
    gameState.startNewGame(mode);
    try {
      await goto('/game');
    } finally {
      transitionLocked = false;
    }
  };

  const continueGame = async () => {
    if (transitionLocked) {
      return;
    }

    transitionLocked = true;
    const loaded = gameState.continueFromSave();
    if (!loaded) {
      canContinue = false;
      transitionLocked = false;
      return;
    }

    try {
      await goto('/game');
    } finally {
      transitionLocked = false;
    }
  };

  const clearSave = () => {
    gameState.clearSave();
    canContinue = false;
  };

  const triggerStart = () => {
    void activateSelectedMenu();
  };

  const triggerSelect = () => {
    showRules = !showRules;
  };

  const triggerA = () => {
    void activateSelectedMenu();
  };

  const triggerB = () => {
    showRules = !showRules;
  };

  const triggerUp = () => {
    moveMenuSelection(-1);
  };

  const triggerDown = () => {
    moveMenuSelection(1);
  };

  const triggerLeft = () => {
    moveMenuSelection(-1);
  };

  const triggerRight = () => {
    moveMenuSelection(1);
  };

  const activateSelectedMenu = async () => {
    if (showRules) {
      showRules = false;
      return;
    }

    const selected = menuOrder[selectedMenuIndex];
    if (!selected) {
      return;
    }

    if (selected === 'continue') {
      await continueGame();
      return;
    }

    if (selected === 'clear') {
      clearSave();
      return;
    }

    if (selected === 'anime-canon') {
      await start('anime-canon');
      return;
    }

    if (selected === 'divergent') {
      await start('divergent');
      return;
    }

    showRules = true;
  };
</script>

<main class="title-page">
  <GBAFrame
    title="Death Note: Kira Protocol"
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
    <GBAScreen>
      <section class="title-screen">
        <!-- Decorative background elements -->
        <div class="bg-vignette"></div>
        <div class="bg-particles"></div>

        <div class="title-content">
          <div class="title-group">
            <h1 class="main-title">DEATH NOTE</h1>
            <div class="subtitle-line">
              <span class="line-left"></span>
              <h2 class="subtitle">KIRA PROTOCOL</h2>
              <span class="line-right"></span>
            </div>
          </div>

          {#if showMenu}
            <div class="mode-buttons">
              {#if canContinue}
                <button
                  type="button"
                  class="btn continue"
                  class:selected={isSelected('continue')}
                  on:mouseenter={() => setSelectedById('continue')}
                  on:click={continueGame}
                >
                  <span class="btn-icon" aria-hidden="true">▶</span>
                  <span class="btn-label">Continue</span>
                </button>
                <button
                  type="button"
                  class="btn clear"
                  class:selected={isSelected('clear')}
                  on:mouseenter={() => setSelectedById('clear')}
                  on:click={clearSave}
                >
                  <span class="btn-icon" aria-hidden="true">✕</span>
                  <span class="btn-label">Clear Save</span>
                </button>
              {/if}

              <button
                type="button"
                class="btn canon"
                class:selected={isSelected('anime-canon')}
                on:mouseenter={() => setSelectedById('anime-canon')}
                on:click={() => start('anime-canon')}
              >
                <span class="btn-icon" aria-hidden="true">◆</span>
                <span class="btn-label">Anime Canon</span>
              </button>
              <button
                type="button"
                class="btn divergent"
                class:selected={isSelected('divergent')}
                on:mouseenter={() => setSelectedById('divergent')}
                on:click={() => start('divergent')}
              >
                <span class="btn-icon" aria-hidden="true">◇</span>
                <span class="btn-label">Divergent Story</span>
              </button>

              <button
                type="button"
                class="btn help"
                class:selected={isSelected('help')}
                on:mouseenter={() => setSelectedById('help')}
                on:click={() => (showRules = true)}
              >
                <span class="btn-icon" aria-hidden="true">?</span>
                <span class="btn-label">How to Play</span>
              </button>
            </div>

            <p class="press-start">PRESS START</p>
          {:else}
            <p class="loading">...</p>
          {/if}

          {#if showRules}
            <div class="rules-overlay">
              <div class="rules-panel" role="dialog" aria-modal="true" aria-labelledby="rules-title">
                <header class="rules-header">
                  <h3 id="rules-title">HOW TO PLAY</h3>
                  <button type="button" class="rules-close" on:click={() => (showRules = false)}>
                    ✕
                  </button>
                </header>

                <div class="rules-body">
                  <p class="label">Objective</p>
                  <p>
                    Build your Kira strategy, keep suspicion under control, and survive L's investigation.
                  </p>
                  <p>
                    In Anime Canon mode, you must also clear each canon milestone before its deadline.
                  </p>

                  <p class="label">Core Loop</p>
                  <ol>
                    <li>Read the current scene and pick dialogue choices.</li>
                    <li>Use activity cards to gain Alibi/Intel or execute risky moves.</li>
                    <li>You have 2 actions per block (Morning, Afternoon, Night).</li>
                    <li>When actions hit 0, time auto-advances to the next block.</li>
                  </ol>

                  <p class="label">Rules</p>
                  <ul>
                    <li>If L meter reaches 100%, you are exposed and lose.</li>
                    <li>Write Judgment requires Intel and sharply raises suspicion.</li>
                    <li>Safe actions (study/family cover) help lower risk.</li>
                    <li>Locked choices show missing requirements under the button.</li>
                    <li>Use the Time panel's Skip button to spend a block quickly.</li>
                  </ul>

                  <p class="label">Mode Notes</p>
                  <ul>
                    <li>Anime Canon: strict milestone windows; missed windows cause canon failure.</li>
                    <li>Divergent: more flexible pathing focused on your stat profile.</li>
                  </ul>

                  <p class="label">Quick Tip</p>
                  <p>Rotate risky Intel/Judgment actions with Alibi-building actions to stay hidden.</p>
                </div>
              </div>
            </div>
          {/if}
        </div>
      </section>
    </GBAScreen>
  </GBAFrame>
</main>

<style>
  .title-page {
    min-height: 100svh;
    width: 100%;
    display: grid;
    place-items: center;
    padding: clamp(12px, 2.5vw, 20px);
  }

  .title-screen {
    width: 100%;
    height: 100%;
    position: relative;
    overflow: hidden;
  }

  /* Background effects */
  .bg-vignette {
    position: absolute;
    inset: 0;
    background:
      radial-gradient(ellipse at 50% 20%, rgba(180, 10, 10, 0.18) 0%, transparent 60%),
      radial-gradient(ellipse at 20% 80%, rgba(10, 10, 30, 0.4) 0%, transparent 50%),
      radial-gradient(ellipse at 80% 70%, rgba(30, 5, 5, 0.2) 0%, transparent 50%);
    pointer-events: none;
  }

  .bg-particles {
    position: absolute;
    inset: 0;
    background:
      radial-gradient(1px 1px at 20% 30%, rgba(200, 0, 0, 0.4), transparent),
      radial-gradient(1px 1px at 80% 20%, rgba(200, 0, 0, 0.3), transparent),
      radial-gradient(1px 1px at 60% 70%, rgba(200, 0, 0, 0.2), transparent),
      radial-gradient(1px 1px at 40% 90%, rgba(200, 0, 0, 0.3), transparent),
      radial-gradient(1px 1px at 10% 60%, rgba(200, 0, 0, 0.15), transparent),
      radial-gradient(1px 1px at 90% 50%, rgba(200, 0, 0, 0.25), transparent);
    animation: flicker 4s infinite;
    pointer-events: none;
  }

  @keyframes flicker {
    0%, 100% { opacity: 0.6; }
    48% { opacity: 0.6; }
    50% { opacity: 0.3; }
    52% { opacity: 0.7; }
    90% { opacity: 0.6; }
    92% { opacity: 0.4; }
    94% { opacity: 0.6; }
  }

  /* Main content */
  .title-content {
    position: relative;
    z-index: 1;
    width: 100%;
    height: 100%;
    padding: 14px 16px;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 10px;
  }

  .title-group {
    width: min(100%, 172px);
    text-align: center;
    display: grid;
    gap: 2px;
  }

  .main-title {
    margin: 0;
    font-size: 22px;
    color: #e8e0e0;
    font-family: var(--font-death-note, 'UnifrakturMaguntia', serif);
    text-shadow:
      0 0 8px rgba(200, 0, 0, 0.5),
      0 0 20px rgba(200, 0, 0, 0.2),
      2px 2px 0px rgba(0, 0, 0, 1);
    line-height: 1;
    letter-spacing: 2px;
    animation: title-glow 3s ease-in-out infinite alternate;
  }

  @keyframes title-glow {
    0% {
      text-shadow:
        0 0 6px rgba(200, 0, 0, 0.3),
        0 0 15px rgba(200, 0, 0, 0.15),
        2px 2px 0px rgba(0, 0, 0, 1);
    }
    100% {
      text-shadow:
        0 0 10px rgba(200, 0, 0, 0.6),
        0 0 25px rgba(200, 0, 0, 0.3),
        2px 2px 0px rgba(0, 0, 0, 1);
    }
  }

  .subtitle-line {
    display: flex;
    align-items: center;
    gap: 4px;
    width: 100%;
  }

  .line-left, .line-right {
    flex: 1;
    height: 1px;
    background: linear-gradient(90deg, transparent, rgba(200, 0, 0, 0.5), transparent);
  }

  .subtitle {
    margin: 0;
    font-size: 6px;
    color: #cc0000;
    font-family: var(--font-pixel, monospace);
    letter-spacing: 3px;
    text-transform: uppercase;
    text-shadow: 0 0 4px rgba(200, 0, 0, 0.4);
  }

  /* Menu buttons */
  .mode-buttons {
    display: grid;
    gap: 4px;
    width: min(100%, 152px);
    animation: fade-up 400ms ease-out;
  }

  @keyframes fade-up {
    from { opacity: 0; transform: translateY(6px); }
    to { opacity: 1; transform: translateY(0); }
  }

  .btn {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 4px;
    border: 1px solid rgba(200, 0, 0, 0.3);
    background: linear-gradient(180deg, rgba(30, 15, 15, 0.95) 0%, rgba(15, 8, 8, 0.95) 100%);
    color: #d0c8c8;
    padding: 4px 6px;
    font-size: 7px;
    font-family: var(--font-pixel, monospace);
    text-transform: uppercase;
    cursor: pointer;
    letter-spacing: 0.5px;
    line-height: 1;
    transition: all 180ms;
    box-shadow:
      0 1px 3px rgba(0, 0, 0, 0.6),
      inset 0 1px 0 rgba(255, 255, 255, 0.04);
  }

  .btn:hover {
    background: linear-gradient(180deg, rgba(60, 10, 10, 0.95) 0%, rgba(30, 5, 5, 0.95) 100%);
    border-color: rgba(200, 0, 0, 0.6);
    color: #fff;
    box-shadow:
      0 1px 3px rgba(0, 0, 0, 0.6),
      0 0 8px rgba(200, 0, 0, 0.2),
      inset 0 1px 0 rgba(255, 255, 255, 0.06);
    transform: translateX(1px);
  }

  .btn.selected {
    border-color: rgba(200, 0, 0, 0.72);
    color: #f4e4e4;
    transform: translateX(2px);
    box-shadow:
      0 1px 3px rgba(0, 0, 0, 0.62),
      0 0 11px rgba(200, 0, 0, 0.26),
      inset 0 1px 0 rgba(255, 255, 255, 0.08);
  }

  .btn:active {
    transform: translateY(1px) translateX(1px);
    box-shadow: 0 0 2px rgba(0, 0, 0, 0.6);
  }

  .btn-icon {
    font-size: 5px;
    line-height: 1;
    min-width: 6px;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    transform: translateY(0.2px);
    color: #cc0000;
  }

  .btn-label {
    line-height: 1;
    display: inline-block;
  }

  .continue {
    background: linear-gradient(180deg, rgba(20, 40, 25, 0.95) 0%, rgba(10, 25, 15, 0.95) 100%);
    border-color: rgba(80, 160, 100, 0.3);
  }
  .continue:hover {
    background: linear-gradient(180deg, rgba(30, 60, 35, 0.95) 0%, rgba(18, 40, 22, 0.95) 100%);
    border-color: rgba(80, 160, 100, 0.6);
    box-shadow:
      0 1px 3px rgba(0, 0, 0, 0.6),
      0 0 8px rgba(50, 150, 80, 0.15),
      inset 0 1px 0 rgba(255, 255, 255, 0.06);
  }
  .continue .btn-icon { color: #4caf50; }

  .clear {
    background: linear-gradient(180deg, rgba(40, 20, 20, 0.9) 0%, rgba(25, 12, 12, 0.9) 100%);
    border-color: rgba(150, 80, 80, 0.3);
    color: #b09090;
    font-size: 6px;
  }

  .help {
    border-color: rgba(74, 141, 181, 0.35);
    background: linear-gradient(180deg, rgba(12, 22, 35, 0.95) 0%, rgba(8, 14, 24, 0.95) 100%);
    color: #b7d0df;
  }

  .help:hover {
    border-color: rgba(74, 141, 181, 0.65);
    background: linear-gradient(180deg, rgba(18, 34, 55, 0.95) 0%, rgba(11, 22, 36, 0.95) 100%);
    box-shadow:
      0 1px 3px rgba(0, 0, 0, 0.6),
      0 0 10px rgba(74, 141, 181, 0.22),
      inset 0 1px 0 rgba(255, 255, 255, 0.07);
  }

  .help .btn-icon {
    color: #6fb2d8;
  }

  .canon .btn-icon { color: #e03030; }
  .divergent .btn-icon { color: #c4a44a; }

  /* Blinking prompt */
  .press-start {
    margin: 0;
    font-size: 5px;
    font-family: var(--font-pixel, monospace);
    color: rgba(200, 200, 200, 0.5);
    letter-spacing: 2px;
    text-transform: uppercase;
    animation: blink-text 1.2s steps(2, end) infinite;
  }

  @keyframes blink-text {
    0%, 49% { opacity: 1; }
    50%, 100% { opacity: 0; }
  }

  .loading {
    margin: 0;
    font-size: 8px;
    color: #666;
  }

  .rules-overlay {
    position: absolute;
    inset: 4px;
    z-index: 3;
    display: grid;
    place-items: center;
    background: rgba(4, 4, 8, 0.88);
    backdrop-filter: blur(1px);
    border: 1px solid rgba(200, 0, 0, 0.2);
  }

  .rules-panel {
    width: min(100%, 196px);
    height: min(100%, 138px);
    display: grid;
    grid-template-rows: auto minmax(0, 1fr);
    border: 1px solid rgba(200, 0, 0, 0.28);
    background: linear-gradient(180deg, rgba(16, 10, 14, 0.98) 0%, rgba(10, 6, 10, 0.98) 100%);
    box-shadow:
      0 0 14px rgba(0, 0, 0, 0.55),
      0 0 8px rgba(200, 0, 0, 0.12);
  }

  .rules-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 4px;
    padding: 3px 5px;
    border-bottom: 1px solid rgba(200, 0, 0, 0.2);
    background: linear-gradient(90deg, rgba(40, 12, 16, 0.7), rgba(12, 8, 14, 0.7));
  }

  .rules-header h3 {
    margin: 0;
    font-size: 5px;
    font-family: var(--font-pixel, monospace);
    letter-spacing: 0.8px;
    color: #d0c2c2;
    text-transform: uppercase;
  }

  .rules-close {
    border: 1px solid rgba(200, 0, 0, 0.2);
    background: linear-gradient(180deg, rgba(35, 12, 12, 0.95) 0%, rgba(20, 8, 8, 0.95) 100%);
    color: #bb9a9a;
    width: 13px;
    height: 11px;
    padding: 0;
    display: grid;
    place-items: center;
    font-size: 5px;
    line-height: 1;
    cursor: pointer;
  }

  .rules-close:hover {
    border-color: rgba(200, 0, 0, 0.45);
    color: #f0d0d0;
  }

  .rules-body {
    min-height: 0;
    overflow-y: auto;
    overflow-x: hidden;
    -webkit-overflow-scrolling: touch;
    -ms-overflow-style: none;
    scrollbar-width: none;
    padding: 4px 5px 6px;
    display: grid;
    gap: 2px;
    font-family: var(--font-pixel, monospace);
    color: #9a8a8a;
  }

  .rules-body::-webkit-scrollbar {
    display: none;
    width: 0;
    height: 0;
  }

  .rules-body p {
    margin: 0;
    font-size: 4px;
    line-height: 1.3;
  }

  .rules-body .label {
    margin-top: 1px;
    font-size: 5px;
    color: #d05f5f;
    letter-spacing: 0.3px;
    text-transform: uppercase;
  }

  .rules-body ol,
  .rules-body ul {
    margin: 0;
    padding-left: 10px;
    display: grid;
    gap: 1px;
  }

  .rules-body li {
    font-size: 4px;
    line-height: 1.25;
  }
</style>
