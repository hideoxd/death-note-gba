<script lang="ts">
  import { SUSPICION_RULES } from '$lib/data';
  import { gameState } from '$lib/stores/gameState';
  import { suspenseMeterMotion } from '$lib/stores/suspicionMotion';
  import { suspicionPercent, suspicionTrend } from '$lib/stores/selectors';

  $: tone =
    $suspicionPercent >= 85 ? 'critical' : $suspicionPercent >= 60 ? 'high' : $suspicionPercent >= 30 ? 'mid' : 'low';
  $: trendLabel =
    $suspicionTrend > 0 ? `▲` : $suspicionTrend < 0 ? `▼` : '—';
  $: trendClass =
    $suspicionTrend > 0 ? 'trend-up' : $suspicionTrend < 0 ? 'trend-down' : 'trend-flat';

  $: tier =
    $suspicionPercent >= SUSPICION_RULES.thresholds.captureRisk
      ? 'CAPTURE'
      : $suspicionPercent >= SUSPICION_RULES.thresholds.activeInvestigation
        ? 'INVEST.'
        : $suspicionPercent >= SUSPICION_RULES.thresholds.watchlist
          ? 'WATCH'
          : 'LOW';

  $: meterWidth = Math.max(0, Math.min(100, Math.round($suspenseMeterMotion)));
</script>

<section class="panel {tone}">
  <div class="header-row">
    <h3>◉ L</h3>
    <span class="pct">{$suspicionPercent}% <span class="{trendClass}">{trendLabel}</span></span>
  </div>

  <div class="meter-shell">
    <div class="meter-fill {tone}" style="width:{meterWidth}%;"></div>
  </div>

  <span class="tier">{tier}</span>
</section>

<style>
  .panel {
    padding: 3px 4px;
    border: 1px solid rgba(200, 0, 0, 0.2);
    background: linear-gradient(180deg, rgba(18, 10, 12, 0.95) 0%, rgba(10, 6, 8, 0.95) 100%);
    display: grid;
    gap: 2px;
    box-shadow: inset 0 0 6px rgba(0, 0, 0, 0.5);
    transition: border-color 300ms;
    flex-shrink: 0;
    overflow: hidden;
  }

  .panel.critical {
    border-color: rgba(255, 0, 0, 0.4);
    animation: danger-pulse 1.5s ease-in-out infinite;
    filter: saturate(1.2) brightness(1.05);
  }

  .panel.high {
    animation: danger-pulse-soft 850ms ease-in-out infinite;
  }

  @keyframes danger-pulse-soft {
    0%,
    100% {
      transform: translateX(0);
    }
    25% {
      transform: translateX(-0.4px);
    }
    75% {
      transform: translateX(0.4px);
    }
  }

  @keyframes danger-pulse {
    0%, 100% { box-shadow: inset 0 0 6px rgba(0,0,0,0.5); }
    50% { box-shadow: inset 0 0 6px rgba(0,0,0,0.5), 0 0 6px rgba(200,0,0,0.15); }
  }

  .header-row {
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

  .pct {
    font-size: 5px;
    font-family: var(--font-pixel, monospace);
    color: #b0a0a0;
  }

  .trend-up { color: #e04040; }
  .trend-down { color: #50a050; }
  .trend-flat { color: #605858; }

  .meter-shell {
    width: 100%;
    height: 4px;
    border: 1px solid rgba(80, 40, 40, 0.3);
    background: rgba(0, 0, 0, 0.5);
    overflow: hidden;
  }

  .meter-fill {
    height: 100%;
    transition: width 400ms steps(12, end);
  }

  .meter-fill.low { background: linear-gradient(90deg, #333, #444); }
  .meter-fill.mid { background: linear-gradient(90deg, #665522, #887733); }
  .meter-fill.high { background: linear-gradient(90deg, #882200, #bb3300); }
  .meter-fill.critical { background: linear-gradient(90deg, #cc0000, #ff2020); }

  .tier {
    font-size: 4px;
    font-family: var(--font-pixel, monospace);
    color: #605858;
    letter-spacing: 0.3px;
  }
</style>
