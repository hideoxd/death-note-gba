<script lang="ts">
  import { goto } from '$app/navigation';
  import { gameState } from '$lib/stores/gameState';

  const backToTitle = async () => {
    gameState.reset();
    await goto('/');
  };
</script>

<div class="overlay">
  <section class="menu">
    <div class="skull">☠</div>
    <h2>GAME OVER</h2>
    <div class="divider"></div>
    <p class="reason">{$gameState.gameOver?.reason ?? 'Unknown cause of death.'}</p>
    {#if $gameState.gameOver?.detail}
      <p class="detail">{$gameState.gameOver.detail}</p>
    {/if}
    <button type="button" on:click={backToTitle}>
      <span class="icon">↩</span> Return to Title
    </button>
  </section>
</div>

<style>
  .overlay {
    position: absolute;
    inset: 0;
    display: grid;
    place-items: center;
    background: rgba(15, 2, 2, 0.88);
    z-index: 30;
    animation: death-fade 600ms ease-out;
  }

  @keyframes death-fade {
    from { opacity: 0; background: rgba(200, 0, 0, 0.3); }
    50% { background: rgba(100, 0, 0, 0.4); }
    to { opacity: 1; background: rgba(15, 2, 2, 0.88); }
  }

  .menu {
    width: 120px;
    display: grid;
    gap: 4px;
    border: 1px solid rgba(200, 50, 50, 0.35);
    background:
      radial-gradient(ellipse at 50% 30%, rgba(80, 10, 10, 0.3), transparent 60%),
      linear-gradient(180deg, rgba(25, 8, 8, 0.98) 0%, rgba(15, 4, 4, 0.98) 100%);
    padding: 8px;
    text-align: center;
    box-shadow:
      0 0 30px rgba(200, 0, 0, 0.15),
      0 0 60px rgba(0, 0, 0, 0.5),
      inset 0 0 10px rgba(200, 0, 0, 0.05);
    animation: menu-in 400ms ease-out 200ms both;
  }

  @keyframes menu-in {
    from { opacity: 0; transform: translateY(-5px); }
    to { opacity: 1; transform: translateY(0); }
  }

  .skull {
    font-size: 14px;
    animation: skull-pulse 2s ease-in-out infinite;
  }

  @keyframes skull-pulse {
    0%, 100% { opacity: 0.7; transform: scale(1); }
    50% { opacity: 1; transform: scale(1.05); }
  }

  h2 {
    margin: 0;
    font-size: 8px;
    font-family: var(--font-pixel, monospace);
    color: #ff4040;
    text-transform: uppercase;
    letter-spacing: 2px;
    text-shadow: 0 0 6px rgba(255, 0, 0, 0.3);
  }

  .divider {
    height: 1px;
    background: linear-gradient(90deg, transparent, rgba(200, 50, 50, 0.4), transparent);
  }

  .reason, .detail {
    margin: 0;
    font-size: 6px;
    font-family: var(--font-pixel, monospace);
    color: #d0a0a0;
    line-height: 1.4;
    text-transform: uppercase;
  }

  .detail {
    color: #a07070;
    font-size: 5px;
  }

  button {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 3px;
    border: 1px solid rgba(200, 60, 60, 0.3);
    background: linear-gradient(180deg, rgba(50, 15, 15, 0.95) 0%, rgba(30, 8, 8, 0.95) 100%);
    color: #d0b0b0;
    padding: 4px 6px;
    font-size: 6px;
    font-family: var(--font-pixel, monospace);
    text-transform: uppercase;
    cursor: pointer;
    letter-spacing: 0.5px;
    transition: all 150ms;
    margin-top: 2px;
  }

  button:hover {
    background: linear-gradient(180deg, rgba(70, 20, 20, 0.95) 0%, rgba(45, 12, 12, 0.95) 100%);
    border-color: rgba(200, 60, 60, 0.5);
    color: #ffe0e0;
    box-shadow: 0 0 8px rgba(200, 0, 0, 0.15);
  }

  .icon {
    color: #cc4040;
    font-size: 7px;
  }
</style>
