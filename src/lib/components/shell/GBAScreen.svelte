<script lang="ts">
  import CRTOverlay from '$lib/components/shell/CRTOverlay.svelte';

  export let glitchActive = false;
</script>

<div class="screen-root" class:glitch-active={glitchActive}>
  <div class="screen-pixel-stage">
    <div class="screen-content">
      <slot />
      <CRTOverlay />
    </div>
  </div>
</div>

<style>
  .screen-root {
    --native-width: 240;
    --native-height: 160;
    --gba-scale: 4;
    display: grid;
    place-items: center;
  }

  .screen-pixel-stage {
    width: calc(var(--native-width) * var(--gba-scale) * 1px);
    height: calc(var(--native-height) * var(--gba-scale) * 1px);
    max-width: 100%;
    max-height: 100%;
  }

  .screen-content {
    position: relative;
    width: 240px;
    height: 160px;
    transform-origin: top left;
    transform: scale(var(--gba-scale));
    image-rendering: pixelated;
    image-rendering: crisp-edges;
    overflow: hidden;
    border-radius: 2px;
    background:
      radial-gradient(ellipse at 70% 15%, rgba(60, 20, 30, 0.25) 0%, transparent 55%),
      radial-gradient(ellipse at 30% 80%, rgba(20, 20, 40, 0.3) 0%, transparent 55%),
      linear-gradient(180deg, #14101a 0%, #0c0810 50%, #080610 100%);
    box-shadow:
      inset 0 0 0 1px rgba(200, 0, 0, 0.12),
      inset 0 0 30px rgba(0, 0, 0, 0.6);
  }

  .glitch-active .screen-content {
    animation: screen-kira-glitch 340ms steps(2, end);
  }

  @keyframes screen-kira-glitch {
    0% {
      filter: hue-rotate(0deg) saturate(1) brightness(1);
      transform: scale(var(--gba-scale));
    }
    20% {
      filter: hue-rotate(-12deg) saturate(1.35) brightness(1.12);
      transform: translate(-0.5px, 0.3px) scale(var(--gba-scale));
    }
    40% {
      filter: hue-rotate(8deg) saturate(1.5) brightness(1.06);
      transform: translate(0.6px, -0.4px) scale(var(--gba-scale));
    }
    70% {
      filter: hue-rotate(-18deg) saturate(1.65) brightness(1.18);
      transform: translate(-0.3px, 0.5px) scale(var(--gba-scale));
    }
    100% {
      filter: hue-rotate(0deg) saturate(1) brightness(1);
      transform: scale(var(--gba-scale));
    }
  }

  @media (max-width: 1060px), (max-height: 760px) {
    .screen-root {
      --gba-scale: 3;
    }
  }

  @media (max-width: 820px), (max-height: 620px) {
    .screen-root {
      --gba-scale: 2;
    }
  }

  @media (max-width: 560px), (max-height: 430px) {
    .screen-root {
      --gba-scale: 1;
    }
  }
</style>
