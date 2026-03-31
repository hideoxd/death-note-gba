<script lang="ts">
  import { onMount } from 'svelte';

  import { playGlitchBoot } from '$lib/utils/sfx';

  let visible = true;

  onMount(() => {
    playGlitchBoot();

    const timer = window.setTimeout(() => {
      visible = false;
    }, 1250);

    return () => {
      window.clearTimeout(timer);
    };
  });
</script>

{#if visible}
  <div class="boot-overlay" aria-hidden="true">
    <div class="logo-drop">RYUK</div>
    <div class="glitch-line"></div>
  </div>
{/if}

<style>
  .boot-overlay {
    position: absolute;
    inset: 0;
    z-index: 40;
    display: grid;
    place-items: center;
    background: radial-gradient(ellipse at center, rgba(28, 12, 20, 0.9) 0%, rgba(6, 4, 8, 0.98) 100%);
    animation: boot-fade 1250ms ease forwards;
  }

  .logo-drop {
    font-family: var(--font-pixel-heading, monospace);
    font-size: 12px;
    letter-spacing: 1px;
    color: #d1c9c9;
    text-shadow:
      -1px 0 rgba(255, 0, 0, 0.55),
      1px 0 rgba(60, 140, 220, 0.45),
      0 0 8px rgba(200, 0, 0, 0.24);
    transform: translateY(-32px);
    animation: logo-drop 620ms cubic-bezier(0.17, 0.82, 0.32, 1.12) forwards;
  }

  .glitch-line {
    position: absolute;
    width: 100%;
    height: 2px;
    background: linear-gradient(90deg, transparent, rgba(255, 80, 80, 0.6), transparent);
    top: 54%;
    animation: glitch-scan 550ms steps(4, end) infinite;
  }

  @keyframes logo-drop {
    0% {
      opacity: 0;
      transform: translateY(-32px) scale(0.9);
    }
    55% {
      opacity: 1;
      transform: translateY(2px) scale(1.02);
    }
    100% {
      transform: translateY(0) scale(1);
    }
  }

  @keyframes glitch-scan {
    0% {
      transform: translateY(-40px);
      opacity: 0;
    }
    50% {
      opacity: 0.9;
    }
    100% {
      transform: translateY(46px);
      opacity: 0;
    }
  }

  @keyframes boot-fade {
    0%,
    85% {
      opacity: 1;
    }
    100% {
      opacity: 0;
      visibility: hidden;
    }
  }
</style>
