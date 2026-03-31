<script lang="ts">
  import { createEventDispatcher } from 'svelte';
  import { playPlasticClick, playTextBlip, vibrateTap } from '$lib/utils/sfx';

  export let title = 'Death Note: Kira Protocol';
  export let pressedStart = false;
  export let pressedSelect = false;
  export let pressedA = false;
  export let pressedB = false;

  const dispatch = createEventDispatcher<{
    start: void;
    select: void;
    a: void;
    b: void;
  }>();

  const triggerStart = () => {
    playTextBlip();
    vibrateTap(14);
    dispatch('start');
  };

  const triggerSelect = () => {
    playTextBlip();
    vibrateTap(14);
    dispatch('select');
  };

  const clickPlastic = () => {
    playPlasticClick();
  };

  const triggerA = () => {
    clickPlastic();
    dispatch('a');
  };

  const triggerB = () => {
    clickPlastic();
    dispatch('b');
  };

  let tiltX = 0;
  let tiltY = 0;

  const handleTilt = (event: MouseEvent) => {
    const target = event.currentTarget as HTMLElement;
    const rect = target.getBoundingClientRect();
    const cx = rect.left + rect.width / 2;
    const cy = rect.top + rect.height / 2;
    const dx = (event.clientX - cx) / (rect.width / 2);
    const dy = (event.clientY - cy) / (rect.height / 2);
    tiltY = Math.max(-4, Math.min(4, dx * 3.6));
    tiltX = Math.max(-3, Math.min(3, -dy * 2.8));
  };

  const resetTilt = () => {
    tiltX = 0;
    tiltY = 0;
  };
</script>

<div
  class="gba-shell"
  role="img"
  aria-label={title}
  on:mousemove={handleTilt}
  on:mouseleave={resetTilt}
  style="transform: perspective(1200px) rotateX({tiltX}deg) rotateY({tiltY}deg);"
>
  <div class="shell-body">
    <!-- Left controls -->
    <div class="dpad-area">
      <div class="dpad" role="group" aria-label="D-Pad">
        <button type="button" class="dpad-v" aria-label="D-Pad vertical" on:click={clickPlastic}></button>
        <button type="button" class="dpad-h" aria-label="D-Pad horizontal" on:click={clickPlastic}></button>
        <div class="dpad-center"></div>
      </div>
    </div>
    
    <!-- Screen area -->
    <div class="screen-bezel">
      <div class="bezel-top">
        <div class="power-led"></div>
        <div class="logo">Death Note <span class="advance">Advance</span></div>
      </div>
      <div class="screen-wrap">
        <slot />
      </div>
    </div>
    
    <!-- Right controls -->
    <div class="buttons-area">
      <div class="action-buttons">
        <button
          type="button"
          class="button b-btn"
          class:pressed={pressedB}
          aria-label="B button"
          title="B - X"
          on:click={triggerB}
        >
          <span>B</span>
        </button>
        <button
          type="button"
          class="button a-btn"
          class:pressed={pressedA}
          aria-label="A button"
          title="A - Z"
          on:click={triggerA}
        >
          <span>A</span>
        </button>
      </div>
      <div class="start-select">
        <button
          type="button"
          class="ss-btn"
          class:pressed={pressedSelect}
          aria-label="Select button (Shift)"
          title="SELECT - Shift"
          on:click={triggerSelect}
        >
          <span>SELECT</span>
        </button>
        <button
          type="button"
          class="ss-btn"
          class:pressed={pressedStart}
          aria-label="Start button (Enter)"
          title="START - Enter"
          on:click={triggerStart}
        >
          <span>START</span>
        </button>
      </div>
      <div class="speaker-holes">
        <i></i><i></i><i></i><i></i><i></i>
        <i></i><i></i><i></i><i></i><i></i>
        <i></i><i></i><i></i><i></i><i></i>
      </div>
    </div>
  </div>
</div>

<style>
  .gba-shell {
    display: flex;
    justify-content: center;
    align-items: center;
    transition: transform 120ms ease-out;
    will-change: transform;
  }

  .shell-body {
    display: flex;
    justify-content: center;
    align-items: center;
    background: linear-gradient(160deg, #252530 0%, #1a1a22 40%, #15151c 100%);
    border-radius: 50px 50px 70px 70px;
    padding: 24px 30px;
    box-shadow:
      0 0 60px rgba(200, 0, 0, 0.06),
      0 20px 40px rgba(0, 0, 0, 0.7),
      0 8px 16px rgba(0, 0, 0, 0.5),
      inset 0 2px 4px rgba(255, 255, 255, 0.08),
      inset 0 -6px 12px rgba(0, 0, 0, 0.6);
    position: relative;
    border: 1px solid rgba(60, 60, 80, 0.3);
  }

  .shell-body::before {
    content: '';
    position: absolute;
    inset: -1px;
    border-radius: inherit;
    background: linear-gradient(160deg, rgba(100, 100, 120, 0.15) 0%, transparent 30%, transparent 70%, rgba(0, 0, 0, 0.2) 100%);
    pointer-events: none;
    z-index: 0;
  }

  .screen-bezel {
    background: linear-gradient(180deg, #0c0c12 0%, #080810 100%);
    border-radius: 8px 8px 14px 14px;
    padding: 10px 14px 14px;
    box-shadow:
      inset 0 4px 10px rgba(0, 0, 0, 0.9),
      inset 0 -2px 6px rgba(0, 0, 0, 0.6),
      0 1px 3px rgba(255, 255, 255, 0.06);
    position: relative;
    margin: 0 20px;
    display: flex;
    flex-direction: column;
    align-items: center;
    z-index: 1;
    border: 1px solid rgba(40, 40, 55, 0.5);
  }

  .bezel-top {
    display: flex;
    align-items: center;
    gap: 8px;
    margin-bottom: 4px;
    width: 100%;
  }

  .power-led {
    width: 5px;
    height: 5px;
    border-radius: 50%;
    background: #cc0000;
    box-shadow: 0 0 6px rgba(200, 0, 0, 0.8), 0 0 12px rgba(200, 0, 0, 0.4);
    animation: glow-pulse 2s ease-in-out infinite;
    flex-shrink: 0;
  }

  @keyframes glow-pulse {
    0%, 100% { box-shadow: 0 0 6px rgba(200, 0, 0, 0.8), 0 0 12px rgba(200, 0, 0, 0.4); }
    50% { box-shadow: 0 0 8px rgba(200, 0, 0, 1), 0 0 20px rgba(200, 0, 0, 0.6); }
  }

  .logo {
    color: #888;
    font-family: var(--font-death-note, 'UnifrakturMaguntia', serif);
    font-size: 14px;
    letter-spacing: 1px;
    text-shadow: 0 1px 3px rgba(0, 0, 0, 0.9);
    user-select: none;
    white-space: nowrap;
  }

  .advance {
    font-family: var(--font-vt, 'VT323', monospace);
    font-size: 9px;
    color: #666;
    letter-spacing: 2px;
    text-transform: uppercase;
    vertical-align: super;
  }

  .screen-wrap {
    background: #000;
    overflow: hidden;
    position: relative;
    border-radius: 2px;
    box-shadow:
      inset 0 0 20px rgba(0, 0, 0, 1),
      0 0 1px rgba(200, 0, 0, 0.15);
    /* Let the GBAScreen component determine the size */
  }

  /* D-Pad */
  .dpad-area {
    width: 90px;
    display: flex;
    justify-content: center;
    align-items: center;
    z-index: 1;
    flex-shrink: 0;
  }

  .dpad {
    position: relative;
    width: 66px;
    height: 66px;
  }

  .dpad-v, .dpad-h {
    background: linear-gradient(180deg, #2e303a 0%, #22242c 100%);
    position: absolute;
    box-shadow:
      inset 0 2px 4px rgba(255, 255, 255, 0.08),
      inset 0 -2px 6px rgba(0, 0, 0, 0.7),
      0 2px 4px rgba(0, 0, 0, 0.4);
    border-radius: 3px;
    border: 1px solid rgba(50, 50, 65, 0.4);
    cursor: pointer;
    padding: 0;
  }

  .dpad-v:active,
  .dpad-h:active {
    transform: scale(0.95);
  }

  .dpad-v {
    width: 22px;
    height: 66px;
    left: 22px;
    top: 0;
  }

  .dpad-h {
    width: 66px;
    height: 22px;
    left: 0;
    top: 22px;
  }

  .dpad-center {
    position: absolute;
    width: 12px;
    height: 12px;
    border-radius: 50%;
    background: #1a1c24;
    left: 27px;
    top: 27px;
    box-shadow: inset 0 1px 3px rgba(0,0,0,0.8);
  }

  /* Action buttons */
  .buttons-area {
    width: 110px;
    display: flex;
    flex-direction: column;
    align-items: flex-end;
    z-index: 1;
    flex-shrink: 0;
  }
  
  .action-buttons {
    display: flex;
    gap: 12px;
    margin-bottom: 22px;
    transform: rotate(-20deg);
  }

  .button {
    width: 30px;
    height: 30px;
    border-radius: 50%;
    background: linear-gradient(135deg, #d84545 0%, #a03030 100%);
    position: relative;
    box-shadow:
      inset 0 2px 3px rgba(255, 120, 120, 0.4),
      inset 0 -3px 6px rgba(0, 0, 0, 0.5),
      0 4px 8px rgba(0, 0, 0, 0.5);
    display: flex;
    justify-content: center;
    align-items: center;
    border: 1px solid rgba(180, 60, 60, 0.4);
    cursor: pointer;
    appearance: none;
    padding: 0;
    transition: transform 80ms ease-out, box-shadow 120ms ease-out;
  }

  .button:active,
  .button.pressed {
    transform: translateY(2px) scale(0.96);
    box-shadow:
      inset 0 1px 2px rgba(255, 120, 120, 0.2),
      inset 0 -2px 4px rgba(0, 0, 0, 0.65),
      0 2px 3px rgba(0, 0, 0, 0.5);
  }

  .button.pressed::after {
    content: '';
    position: absolute;
    inset: 4px;
    border-radius: 50%;
    background: radial-gradient(circle, rgba(255, 100, 100, 0.25) 0%, transparent 70%);
    animation: btn-ripple 200ms ease-out forwards;
    pointer-events: none;
  }

  .button span {
    position: absolute;
    top: -14px;
    color: #555;
    font-weight: bold;
    font-family: sans-serif;
    font-size: 9px;
    transform: rotate(20deg);
    user-select: none;
    transition: color 80ms, transform 80ms;
  }

  .button.pressed span {
    color: #cc4444;
    transform: rotate(20deg) scale(0.9);
  }

  .start-select {
    display: flex;
    gap: 8px;
    margin-bottom: 16px;
    transform: rotate(-10deg);
  }

  .ss-btn {
    width: 24px;
    height: 6px;
    background: linear-gradient(180deg, #2e303a 0%, #22242c 100%);
    border-radius: 8px;
    position: relative;
    box-shadow:
      inset 0 1px 3px rgba(0, 0, 0, 0.8),
      0 1px 2px rgba(255, 255, 255, 0.1);
    border: 1px solid rgba(50, 50, 65, 0.3);
    cursor: pointer;
    transition: transform 90ms ease-out, box-shadow 120ms ease-out;
    appearance: none;
    padding: 0;
  }

  .ss-btn:hover {
    box-shadow:
      inset 0 1px 3px rgba(0, 0, 0, 0.8),
      0 1px 2px rgba(255, 255, 255, 0.15),
      0 0 4px rgba(180, 180, 220, 0.08);
  }

  .ss-btn:active {
    transform: translateY(1px);
  }

  .ss-btn.pressed {
    transform: translateY(1px);
    box-shadow:
      inset 0 1px 3px rgba(0, 0, 0, 0.8),
      0 0 0 rgba(255, 255, 255, 0);
  }

  .ss-btn.pressed span {
    color: #888;
    text-shadow: 0 0 3px rgba(200, 200, 220, 0.15);
  }

  .ss-btn span {
    position: absolute;
    top: -12px;
    color: #444;
    font-size: 5px;
    font-weight: bold;
    font-family: sans-serif;
    left: 50%;
    transform: translateX(-50%);
    letter-spacing: 0.5px;
    user-select: none;
    pointer-events: none;
  }

  .speaker-holes {
    display: grid;
    grid-template-columns: repeat(5, 1fr);
    gap: 3px;
    margin-right: 14px;
  }

  .speaker-holes i {
    width: 3px;
    height: 3px;
    background: rgba(30, 30, 40, 0.8);
    border-radius: 50%;
    box-shadow: inset 0 1px 2px rgba(0, 0, 0, 0.9);
  }

  /* Responsive — hide controls on smaller screens */
  @media (max-width: 900px) {
    .dpad-area, .buttons-area {
      display: none;
    }
    .screen-bezel {
      margin: 0;
    }
    .shell-body {
      padding: 12px;
      border-radius: 16px;
    }
  }

  @keyframes btn-ripple {
    0% {
      opacity: 1;
      transform: scale(0.6);
    }
    100% {
      opacity: 0;
      transform: scale(1.2);
    }
  }
</style>
