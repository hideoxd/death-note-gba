<script lang="ts">
  import CRTOverlay from '$lib/components/shell/CRTOverlay.svelte';
</script>

<div class="screen-root">
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
