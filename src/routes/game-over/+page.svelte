<script lang="ts">
  import { goto } from '$app/navigation';
  import GBAFrame from '$lib/components/shell/GBAFrame.svelte';
  import GBAScreen from '$lib/components/shell/GBAScreen.svelte';
  import { gameState } from '$lib/stores/gameState';

  const back = async () => {
    gameState.reset();
    await goto('/');
  };
</script>

<main class="over-page">
  <GBAFrame title="Game Over">
    <GBAScreen>
      <section class="over-screen">
        <div class="bg-red-flash"></div>

        <div class="content">
          <div class="skull">☠</div>
          <h1>GAME OVER</h1>
          <div class="divider"></div>
          <p class="reason">{$gameState.gameOver?.reason ?? 'Unknown'}</p>
          {#if $gameState.gameOver?.detail}
            <p class="detail">{$gameState.gameOver?.detail}</p>
          {/if}
          <button type="button" on:click={back}>
            <span class="icon">↩</span> Return to Title
          </button>
        </div>
      </section>
    </GBAScreen>
  </GBAFrame>
</main>

<style>
  .over-page {
    min-height: 100svh;
    width: 100%;
    display: grid;
    place-items: center;
    padding: clamp(12px, 2.5vw, 20px);
  }

  .over-screen {
    width: 100%;
    height: 100%;
    position: relative;
    overflow: hidden;
  }

  .bg-red-flash {
    position: absolute;
    inset: 0;
    background:
      radial-gradient(ellipse at 50% 40%, rgba(180, 10, 10, 0.2) 0%, transparent 60%),
      linear-gradient(180deg, rgba(25, 5, 8, 1) 0%, rgba(10, 2, 4, 1) 100%);
    animation: bg-death 3s ease-in-out infinite alternate;
  }

  @keyframes bg-death {
    0% { opacity: 0.7; }
    100% { opacity: 1; }
  }

  .content {
    position: relative;
    z-index: 1;
    width: 100%;
    height: 100%;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 4px;
    padding: 16px;
    animation: content-in 600ms ease-out;
  }

  @keyframes content-in {
    from { opacity: 0; transform: translateY(-6px); }
    to { opacity: 1; transform: translateY(0); }
  }

  .skull {
    font-size: 20px;
    animation: skull-pulse 2s ease-in-out infinite;
  }

  @keyframes skull-pulse {
    0%, 100% { opacity: 0.6; transform: scale(1); }
    50% { opacity: 1; transform: scale(1.08); }
  }

  h1 {
    margin: 0;
    font-size: 12px;
    font-family: var(--font-pixel, monospace);
    color: #ff3030;
    text-transform: uppercase;
    letter-spacing: 3px;
    text-shadow: 0 0 10px rgba(255, 0, 0, 0.4), 2px 2px 0px rgba(0, 0, 0, 1);
  }

  .divider {
    width: 60px;
    height: 1px;
    background: linear-gradient(90deg, transparent, rgba(200, 50, 50, 0.4), transparent);
  }

  .reason, .detail {
    margin: 0;
    text-align: center;
    font-family: var(--font-pixel, monospace);
    text-transform: uppercase;
    color: #d0a0a0;
    width: min(100%, 176px);
  }

  .reason {
    font-size: 7px;
  }

  .detail {
    font-size: 6px;
    color: #a07070;
  }

  button {
    display: flex;
    align-items: center;
    gap: 4px;
    border: 1px solid rgba(200, 60, 60, 0.35);
    background: linear-gradient(180deg, rgba(55, 15, 15, 0.95) 0%, rgba(35, 8, 8, 0.95) 100%);
    color: #d0b0b0;
    padding: 5px 10px;
    font-size: 7px;
    font-family: var(--font-pixel, monospace);
    text-transform: uppercase;
    cursor: pointer;
    letter-spacing: 0.5px;
    transition: all 150ms;
    margin-top: 4px;
  }

  button:hover {
    background: linear-gradient(180deg, rgba(75, 20, 20, 0.95) 0%, rgba(50, 12, 12, 0.95) 100%);
    border-color: rgba(200, 60, 60, 0.5);
    color: #ffe0e0;
    box-shadow: 0 0 10px rgba(200, 0, 0, 0.2);
  }

  .icon {
    color: #cc4040;
    font-size: 8px;
  }
</style>
