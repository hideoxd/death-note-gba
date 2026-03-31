<div class="lcd-overlay" aria-hidden="true">
  <div class="scanline-sweep"></div>
</div>

<style>
  .lcd-overlay {
    position: absolute;
    inset: 0;
    pointer-events: none;
    z-index: 100;
    overflow: hidden;
  }

  /* Scanline + RGB subpixel grid */
  .lcd-overlay::before {
    content: '';
    position: absolute;
    inset: 0;
    background:
      repeating-linear-gradient(
        180deg,
        transparent 0,
        transparent 1px,
        rgba(0, 0, 0, 0.15) 1px,
        rgba(0, 0, 0, 0.15) 2px
      ),
      repeating-linear-gradient(
        90deg,
        rgba(255, 0, 0, 0.03) 0,
        rgba(255, 0, 0, 0.03) 1px,
        rgba(0, 255, 0, 0.015) 1px,
        rgba(0, 255, 0, 0.015) 2px,
        rgba(0, 0, 255, 0.03) 2px,
        rgba(0, 0, 255, 0.03) 3px
      );
    opacity: 0.55;
    mix-blend-mode: overlay;
    animation: crt-flicker 1.8s steps(3, end) infinite;
  }

  /* Screen reflection */
  .lcd-overlay::after {
    content: '';
    position: absolute;
    inset: 0;
    background: linear-gradient(
      135deg,
      rgba(255, 255, 255, 0.06) 0%,
      rgba(255, 255, 255, 0) 35%,
      rgba(255, 255, 255, 0) 65%,
      rgba(255, 255, 255, 0.015) 100%
    );
    pointer-events: none;
  }

  /* Slow moving scan line */
  .scanline-sweep {
    position: absolute;
    left: 0;
    right: 0;
    height: 3px;
    background: linear-gradient(
      180deg,
      transparent 0%,
      rgba(200, 0, 0, 0.04) 40%,
      rgba(200, 0, 0, 0.06) 50%,
      rgba(200, 0, 0, 0.04) 60%,
      transparent 100%
    );
    animation: sweep 6s linear infinite;
  }

  @keyframes sweep {
    0% { top: -3px; }
    100% { top: 100%; }
  }

  @keyframes crt-flicker {
    0%,
    100% {
      opacity: 0.55;
    }
    48% {
      opacity: 0.5;
    }
    50% {
      opacity: 0.62;
    }
    52% {
      opacity: 0.54;
    }
  }
</style>
