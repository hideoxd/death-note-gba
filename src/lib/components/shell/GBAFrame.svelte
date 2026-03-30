<script lang="ts">
  export let title = 'Death Note: Kira Protocol';
</script>

<div class="gba-shell" aria-label={title}>
  <div class="shell-body">
    <!-- Left controls -->
    <div class="dpad-area">
      <div class="dpad">
        <div class="dpad-v"></div>
        <div class="dpad-h"></div>
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
        <div class="button b-btn"><span>B</span></div>
        <div class="button a-btn"><span>A</span></div>
      </div>
      <div class="start-select">
        <div class="ss-btn"><span>SELECT</span></div>
        <div class="ss-btn"><span>START</span></div>
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
</style>
