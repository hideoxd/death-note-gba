<script lang="ts">
  import { gameState } from '$lib/stores/gameState';

  export let activity: {
    id: string;
    label: string;
    description: string;
    tutorialHint?: string;
    disabled: boolean;
    unmet: string[];
  };

  const perform = () => {
    if (activity.disabled) return;
    gameState.performActivity(activity.id);
  };
</script>

<article class="card" class:disabled={activity.disabled}>
  <h4>{activity.label}</h4>
  <p class="desc">{activity.description}</p>
  {#if activity.tutorialHint}
    <p class="hint">TIP: {activity.tutorialHint}</p>
  {/if}
  {#if activity.unmet.length > 0}
    <p class="lock">🔒 {activity.unmet.join(' | ')}</p>
  {/if}
  <button type="button" on:click={perform} disabled={activity.disabled}>
    {activity.disabled ? '✕' : '▸'} DO
  </button>
</article>

<style>
  .card {
    display: grid;
    grid-template-rows: auto auto auto 1fr;
    gap: 1px;
    padding: 3px;
    border: 1px solid rgba(200, 0, 0, 0.12);
    background: linear-gradient(180deg, rgba(16, 10, 12, 0.95) 0%, rgba(10, 6, 8, 0.95) 100%);
    box-shadow: inset 0 0 4px rgba(0, 0, 0, 0.3);
    transition: border-color 150ms;
  }

  .card:not(.disabled):hover {
    border-color: rgba(200, 0, 0, 0.25);
  }

  .disabled { opacity: 0.45; }

  h4 {
    margin: 0;
    font-size: 5px;
    font-family: var(--font-pixel, monospace);
    color: #b0a0a0;
    letter-spacing: 0.3px;
    text-transform: uppercase;
  }

  .desc {
    margin: 0;
    font-size: 4px;
    line-height: 1.3;
    color: #706060;
    font-family: var(--font-pixel, monospace);
  }

  .lock {
    margin: 0;
    font-size: 4px;
    color: #aa5555;
    font-family: var(--font-pixel, monospace);
  }

  .hint {
    margin: 0;
    font-size: 4px;
    line-height: 1.25;
    color: #6a8a74;
    font-family: var(--font-pixel, monospace);
  }

  button {
    width: 100%;
    border: 1px solid rgba(200, 0, 0, 0.18);
    background: linear-gradient(180deg, rgba(30, 12, 12, 0.95) 0%, rgba(18, 6, 6, 0.95) 100%);
    color: #a09090;
    padding: 1px 3px;
    font-size: 4px;
    font-family: var(--font-pixel, monospace);
    text-transform: uppercase;
    cursor: pointer;
    transition: all 150ms;
    align-self: end;
  }

  button:hover:not(:disabled) {
    background: linear-gradient(180deg, rgba(50, 15, 15, 0.95) 0%, rgba(30, 8, 8, 0.95) 100%);
    border-color: rgba(200, 0, 0, 0.35);
    color: #d0c0c0;
  }

  button:disabled {
    opacity: 0.35;
    cursor: not-allowed;
  }
</style>
