<script lang="ts">
  import { gameState } from '$lib/stores/gameState';

  const resume = () => {
    gameState.setPhase('playing');
  };

  const closeOnBackdrop = (event: MouseEvent) => {
    if (event.target !== event.currentTarget) {
      return;
    }

    resume();
  };
</script>

<div class="overlay" role="button" tabindex="0" on:click={closeOnBackdrop} on:keydown={(event) => {
  if (event.key === 'Enter' || event.key === ' ') {
    event.preventDefault();
    resume();
  }
}}>
  <section class="menu">
    <div class="menu-header">
      <h2>⏸ PAUSED</h2>
      <div class="divider"></div>
    </div>
    <button type="button" on:click={resume}>
      <span class="icon">▸</span> Resume
    </button>
  </section>
</div>

<style>
  .overlay {
    position: absolute;
    inset: 0;
    display: grid;
    place-items: center;
    background: rgba(4, 2, 4, 0.85);
    z-index: 25;
    backdrop-filter: blur(1px);
    animation: overlay-in 150ms ease-out;
  }

  .overlay:focus {
    outline: none;
  }

  @keyframes overlay-in {
    from { opacity: 0; }
    to { opacity: 1; }
  }

  .menu {
    width: 100px;
    display: grid;
    gap: 5px;
    border: 1px solid rgba(200, 0, 0, 0.25);
    background:
      linear-gradient(180deg, rgba(20, 10, 12, 0.98) 0%, rgba(12, 6, 8, 0.98) 100%);
    padding: 8px;
    box-shadow:
      0 0 20px rgba(0, 0, 0, 0.5),
      0 0 8px rgba(200, 0, 0, 0.1),
      inset 0 1px 0 rgba(255, 255, 255, 0.03);
    animation: menu-pop 200ms ease-out;
  }

  @keyframes menu-pop {
    from { opacity: 0; transform: scale(0.9); }
    to { opacity: 1; transform: scale(1); }
  }

  .menu-header {
    display: grid;
    gap: 3px;
  }

  h2 {
    margin: 0;
    font-size: 7px;
    font-family: var(--font-pixel, monospace);
    color: #d0c0c0;
    text-transform: uppercase;
    letter-spacing: 1px;
  }

  .divider {
    height: 1px;
    background: linear-gradient(90deg, rgba(200, 0, 0, 0.3), transparent);
  }

  button {
    display: flex;
    align-items: center;
    gap: 3px;
    border: 1px solid rgba(200, 0, 0, 0.2);
    background: linear-gradient(180deg, rgba(30, 12, 14, 0.95) 0%, rgba(18, 6, 8, 0.95) 100%);
    color: #b0a0a0;
    padding: 4px 6px;
    font-size: 6px;
    font-family: var(--font-pixel, monospace);
    text-transform: uppercase;
    cursor: pointer;
    letter-spacing: 0.5px;
    transition: all 150ms;
  }

  button:hover {
    background: linear-gradient(180deg, rgba(50, 15, 15, 0.95) 0%, rgba(30, 8, 8, 0.95) 100%);
    border-color: rgba(200, 0, 0, 0.4);
    color: #e0d0d0;
    box-shadow: 0 0 6px rgba(200, 0, 0, 0.15);
  }

  .icon {
    color: #cc0000;
    font-size: 6px;
  }
</style>
