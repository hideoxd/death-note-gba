<script lang="ts">
  import { gameState } from '$lib/stores/gameState';
  import { activityOptions } from '$lib/stores/selectors';

  $: intelAction = $activityOptions.find((activity) => activity.id === 'intel-scanner');
  $: judgmentAction = $activityOptions.find((activity) => activity.id === 'judgment-write');

  const quickIntel = () => {
    if (intelAction?.disabled) return;
    gameState.performActivity('intel-scanner');
  };

  const quickJudgment = () => {
    if (judgmentAction?.disabled) return;
    gameState.performActivity('judgment-write');
  };
</script>

<section class="intel-desk">
  <h3>⌖ INTEL</h3>
  <div class="actions">
    <button type="button" on:click={quickIntel} disabled={intelAction?.disabled}>◈ Scan</button>
    <button type="button" class="judgment" on:click={quickJudgment} disabled={judgmentAction?.disabled}>✦ Judge</button>
  </div>
  {#if judgmentAction && judgmentAction.unmet.length > 0}
    <p class="lock">🔒 {judgmentAction.unmet.join(' | ')}</p>
  {/if}
</section>

<style>
  .intel-desk {
    display: grid;
    gap: 2px;
    padding: 3px 4px;
    border: 1px solid rgba(200, 0, 0, 0.2);
    background: linear-gradient(180deg, rgba(18, 10, 12, 0.95) 0%, rgba(10, 6, 8, 0.95) 100%);
    box-shadow: inset 0 0 6px rgba(0, 0, 0, 0.5);
    flex-shrink: 0;
    overflow: hidden;
  }

  h3 {
    margin: 0;
    font-size: 5px;
    font-family: var(--font-pixel, monospace);
    color: #cc0000;
    letter-spacing: 0.5px;
    text-shadow: 0 0 3px rgba(200, 0, 0, 0.3);
  }

  .actions {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 2px;
  }

  button {
    border: 1px solid rgba(200, 0, 0, 0.2);
    background: linear-gradient(180deg, rgba(28, 12, 14, 0.95) 0%, rgba(18, 6, 8, 0.95) 100%);
    color: #a09090;
    padding: 2px 3px;
    font-size: 5px;
    font-family: var(--font-pixel, monospace);
    text-transform: uppercase;
    cursor: pointer;
    transition: all 150ms;
  }

  button:hover:not(:disabled) {
    background: linear-gradient(180deg, rgba(45, 15, 15, 0.95) 0%, rgba(30, 8, 8, 0.95) 100%);
    border-color: rgba(200, 0, 0, 0.4);
    color: #d0c0c0;
  }

  .judgment {
    border-color: rgba(196, 164, 74, 0.2);
    background: linear-gradient(180deg, rgba(22, 18, 10, 0.95) 0%, rgba(14, 12, 6, 0.95) 100%);
  }

  .judgment:hover:not(:disabled) {
    border-color: rgba(196, 164, 74, 0.4);
    background: linear-gradient(180deg, rgba(35, 28, 14, 0.95) 0%, rgba(25, 20, 10, 0.95) 100%);
  }

  button:disabled {
    opacity: 0.35;
    cursor: not-allowed;
  }

  .lock {
    margin: 0;
    font-size: 4px;
    color: #aa5555;
    font-family: var(--font-pixel, monospace);
  }
</style>
