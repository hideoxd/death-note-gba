<script lang="ts">
  import { gameState } from '$lib/stores/gameState';
  import { clockLabel, mode, suspicionPercent, shinigamiEyeActive } from '$lib/stores/selectors';
  import { suspenseMeterMotion } from '$lib/stores/suspicionMotion';

  $: riskClass = $suspicionPercent >= 85 ? 'critical' : $suspicionPercent >= 60 ? 'high' : 'stable';
  $: willpowerPercent = Math.round($gameState.stats.willpower);
  $: batteryCells = [25, 50, 75, 95].map((threshold) => willpowerPercent >= threshold);
  $: eyeClass = $shinigamiEyeActive ? 'eye-on' : 'eye-off';
  $: stripWidth = Math.max(0, Math.min(100, Math.round($suspenseMeterMotion)));
  $: stripSpike = $gameState.suspicion.trend >= 8;
</script>

<header class="top-bar" class:spike={stripSpike}>
  <span class="pill mode-pill">
    <span class="dot mode-dot"></span>
    {$mode === 'anime-canon' ? 'CANON' : 'DVRG'}
  </span>
  <span class="pill time-pill">{$clockLabel}</span>
  <span class="pill danger-pill {riskClass}">
    <span class="dot danger-dot"></span>
    L:{$suspicionPercent}%
  </span>
  <span class="pill battery-pill" title="Willpower battery">
    <span class="battery-icon" aria-hidden="true">
      {#each batteryCells as active}
        <i class:active></i>
      {/each}
    </span>
    W:{willpowerPercent}
  </span>
  <span class="pill eye-pill {eyeClass}">
    {$shinigamiEyeActive ? 'EYE ON' : 'EYE OFF'}
  </span>

  <div class="suspicion-strip" aria-hidden="true">
    <div class="suspicion-strip-fill {riskClass}" style="width: {stripWidth}%"></div>
  </div>
</header>

<style>
  .top-bar {
    position: relative;
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 2px 3px;
    background: linear-gradient(180deg, rgba(20, 8, 8, 0.98) 0%, rgba(10, 4, 4, 0.95) 100%);
    border-bottom: 1px solid rgba(200, 0, 0, 0.15);
    box-shadow: 0 1px 4px rgba(0, 0, 0, 0.6);
    flex-shrink: 0;
  }

  .suspicion-strip {
    position: absolute;
    left: 2px;
    right: 2px;
    bottom: 0;
    height: 2px;
    border-top: 1px solid rgba(200, 0, 0, 0.14);
    background: rgba(0, 0, 0, 0.32);
    transform: translateY(1px);
    transition: transform 220ms ease-out;
  }

  .top-bar.spike .suspicion-strip {
    transform: translateY(-1px);
  }

  .suspicion-strip-fill {
    height: 100%;
    transition: width 260ms ease-out;
  }

  .suspicion-strip-fill.stable {
    background: linear-gradient(90deg, #564848, #726060);
  }

  .suspicion-strip-fill.high {
    background: linear-gradient(90deg, #8a3a24, #bf5032);
  }

  .suspicion-strip-fill.critical {
    background: linear-gradient(90deg, #ad1414, #ef3b3b);
    box-shadow: 0 0 4px rgba(239, 59, 59, 0.35);
  }

  .pill {
    padding: 1px 3px;
    font-size: 4px;
    font-family: var(--font-pixel, monospace);
    letter-spacing: 0.03em;
    color: #a09090;
    display: flex;
    align-items: center;
    gap: 2px;
  }

  .dot {
    width: 2px;
    height: 2px;
    border-radius: 50%;
    display: inline-block;
  }

  .mode-dot {
    background: #4a8db5;
    box-shadow: 0 0 2px rgba(74, 141, 181, 0.5);
  }

  .time-pill {
    font-family: var(--font-death-note, serif);
    font-size: 6px;
    letter-spacing: 0.3px;
    color: #b8b0b0;
  }

  .danger-pill {
    color: #c05050;
  }

  .danger-dot {
    background: #cc0000;
    box-shadow: 0 0 2px rgba(200, 0, 0, 0.5);
  }

  .danger-pill.high .danger-dot {
    animation: blink 1s ease-in-out infinite;
  }

  .danger-pill.critical {
    color: #ff3030;
    text-shadow: 0 0 3px rgba(255, 0, 0, 0.3);
  }
  .danger-pill.critical .danger-dot {
    animation: blink 0.4s ease-in-out infinite;
    background: #ff0000;
  }

  .battery-pill {
    min-width: 27px;
    justify-content: flex-end;
    gap: 1px;
    color: #84b688;
  }

  .eye-pill {
    min-width: 28px;
    justify-content: center;
    color: #7c6f6f;
  }

  .eye-pill.eye-on {
    color: #dc7f7f;
    text-shadow: 0 0 4px rgba(220, 70, 70, 0.35);
    animation: eye-pulse 480ms steps(2, end) infinite;
  }

  .eye-pill.eye-off {
    color: #6b5e5e;
  }

  .battery-icon {
    width: 11px;
    height: 5px;
    border: 1px solid rgba(130, 190, 140, 0.35);
    display: inline-grid;
    grid-template-columns: repeat(4, 1fr);
    gap: 1px;
    padding: 0 1px;
    position: relative;
  }

  .battery-icon::after {
    content: '';
    position: absolute;
    right: -2px;
    top: 1px;
    width: 1px;
    height: 2px;
    background: rgba(130, 190, 140, 0.45);
  }

  .battery-icon i {
    display: block;
    background: rgba(50, 90, 55, 0.35);
  }

  .battery-icon i.active {
    background: linear-gradient(180deg, #83c88a 0%, #569b61 100%);
  }

  @keyframes blink {
    0%, 100% { opacity: 1; }
    50% { opacity: 0.3; }
  }

  @keyframes eye-pulse {
    0%,
    100% {
      opacity: 1;
    }
    50% {
      opacity: 0.56;
    }
  }
</style>
