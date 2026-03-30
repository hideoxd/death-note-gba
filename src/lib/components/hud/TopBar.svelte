<script lang="ts">
  import { clockLabel, mode, suspicionPercent } from '$lib/stores/selectors';

  $: riskClass = $suspicionPercent >= 85 ? 'critical' : $suspicionPercent >= 60 ? 'high' : 'stable';
</script>

<header class="top-bar">
  <span class="pill mode-pill">
    <span class="dot mode-dot"></span>
    {$mode === 'anime-canon' ? 'CANON' : 'DVRG'}
  </span>
  <span class="pill time-pill">{$clockLabel}</span>
  <span class="pill danger-pill {riskClass}">
    <span class="dot danger-dot"></span>
    L:{$suspicionPercent}%
  </span>
</header>

<style>
  .top-bar {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 2px 3px;
    background: linear-gradient(180deg, rgba(20, 8, 8, 0.98) 0%, rgba(10, 4, 4, 0.95) 100%);
    border-bottom: 1px solid rgba(200, 0, 0, 0.15);
    box-shadow: 0 1px 4px rgba(0, 0, 0, 0.6);
    flex-shrink: 0;
  }

  .pill {
    padding: 1px 3px;
    font-size: 5px;
    font-family: var(--font-pixel, monospace);
    letter-spacing: 0.05em;
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
    font-size: 7px;
    letter-spacing: 0.5px;
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

  @keyframes blink {
    0%, 100% { opacity: 1; }
    50% { opacity: 0.3; }
  }
</style>
