<script lang="ts">
  import { gameState } from '$lib/stores/gameState';

  // World opinion ranges from -100 (pro-Kira worship) to +100 (anti-Kira fury)
  // Starts at 0 (neutral curiosity)
  $: rawOpinion = typeof $gameState.flags.world_opinion === 'number' ? $gameState.flags.world_opinion : 0;
  $: opinion = Math.round(rawOpinion);
  $: absOpinion = Math.abs(opinion);

  // Sentiment tiers
  $: tier = opinion >= 60 ? 'hostile'
    : opinion >= 30 ? 'fearful'
    : opinion >= -10 ? 'divided'
    : opinion >= -40 ? 'supportive'
    : 'worship';

  $: label = tier === 'hostile' ? 'HOSTILE'
    : tier === 'fearful' ? 'FEARFUL'
    : tier === 'divided' ? 'DIVIDED'
    : tier === 'supportive' ? 'PRO-KIRA'
    : 'WORSHIP';

  // Bar position: map [-100, 100] → [0%, 100%]
  $: barPercent = Math.min(100, Math.max(0, (opinion + 100) / 2));

  // Elimination count affects display
  $: elimCount = $gameState.investigation.eliminationLog.length;
  $: decoyCount = $gameState.investigation.eliminationLog.filter(e => e.decoy).length;
</script>

<section class="opinion-panel">
  <h3>☷ WORLD</h3>
  <div class="opinion-bar-wrap">
    <span class="pole-label left">♥</span>
    <div class="opinion-bar">
      <div class="opinion-fill {tier}" style="width: {barPercent}%"></div>
      <div class="opinion-marker" style="left: {barPercent}%"></div>
    </div>
    <span class="pole-label right">✕</span>
  </div>
  <div class="opinion-row">
    <span class="opinion-label {tier}">{label}</span>
    <span class="opinion-val">{opinion > 0 ? '+' : ''}{opinion}</span>
  </div>
  {#if elimCount > 0}
    <div class="opinion-detail">
      <span>Deaths: {elimCount}</span>
      {#if decoyCount > 0}
        <span class="decoy-warn">Innocents: {decoyCount}</span>
      {/if}
    </div>
  {/if}
</section>

<style>
  .opinion-panel {
    padding: 3px 4px;
    border: 1px solid rgba(200, 160, 60, 0.18);
    background: linear-gradient(180deg, rgba(18, 14, 10, 0.95) 0%, rgba(10, 8, 6, 0.95) 100%);
    box-shadow: inset 0 0 6px rgba(0, 0, 0, 0.5);
    flex-shrink: 0;
    overflow: hidden;
    display: grid;
    gap: 2px;
  }

  h3 {
    margin: 0;
    font-size: 5px;
    font-family: var(--font-pixel, monospace);
    color: #c4a44a;
    letter-spacing: 0.5px;
    text-shadow: 0 0 3px rgba(196, 164, 74, 0.25);
  }

  .opinion-bar-wrap {
    display: grid;
    grid-template-columns: 6px 1fr 6px;
    align-items: center;
    gap: 1px;
  }

  .pole-label {
    font-size: 4px;
    font-family: var(--font-pixel, monospace);
    text-align: center;
    line-height: 1;
  }

  .pole-label.left {
    color: #6aaa6a;
  }

  .pole-label.right {
    color: #cc5555;
  }

  .opinion-bar {
    height: 3px;
    background: linear-gradient(90deg, rgba(40, 70, 40, 0.4), rgba(50, 50, 30, 0.3), rgba(70, 30, 30, 0.4));
    border: 1px solid rgba(100, 80, 40, 0.2);
    position: relative;
    overflow: hidden;
  }

  .opinion-fill {
    position: absolute;
    top: 0;
    left: 0;
    height: 100%;
    transition: width 400ms steps(8, end);
  }

  .opinion-fill.worship { background: linear-gradient(90deg, #2a5a30, #4caf50); }
  .opinion-fill.supportive { background: linear-gradient(90deg, #3a6a3a, #6ab86a); }
  .opinion-fill.divided { background: linear-gradient(90deg, #6a6a2a, #c4a44a); }
  .opinion-fill.fearful { background: linear-gradient(90deg, #8a5a2a, #cc7040); }
  .opinion-fill.hostile { background: linear-gradient(90deg, #7a2a2a, #cc3535); }

  .opinion-marker {
    position: absolute;
    top: -1px;
    width: 1px;
    height: 5px;
    background: #e8e0d0;
    transform: translateX(-0.5px);
    transition: left 400ms steps(8, end);
    box-shadow: 0 0 2px rgba(255, 255, 255, 0.3);
  }

  .opinion-row {
    display: flex;
    justify-content: space-between;
    align-items: center;
  }

  .opinion-label {
    font-size: 4px;
    font-family: var(--font-pixel, monospace);
    letter-spacing: 0.3px;
    text-transform: uppercase;
  }

  .opinion-label.worship { color: #5cb85c; }
  .opinion-label.supportive { color: #7ac87a; }
  .opinion-label.divided { color: #c4a44a; }
  .opinion-label.fearful { color: #cc7040; }
  .opinion-label.hostile { color: #e04040; animation: hostile-blink 800ms steps(2, end) infinite; }

  .opinion-val {
    font-size: 5px;
    font-family: var(--font-pixel, monospace);
    color: #908070;
    text-align: right;
  }

  .opinion-detail {
    display: flex;
    justify-content: space-between;
    gap: 3px;
    font-size: 4px;
    font-family: var(--font-pixel, monospace);
    color: #706060;
  }

  .decoy-warn {
    color: #cc6060;
    animation: decoy-flash 1200ms steps(2, end) infinite;
  }

  @keyframes hostile-blink {
    0%, 60% { opacity: 1; }
    61%, 100% { opacity: 0.5; }
  }

  @keyframes decoy-flash {
    0%, 70% { opacity: 1; }
    71%, 100% { opacity: 0.4; }
  }
</style>
