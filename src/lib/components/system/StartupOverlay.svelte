<script lang="ts">
  import { onMount } from 'svelte';
  import { playGlitchBoot } from '$lib/utils/sfx';

  let phase: 'gba-logo' | 'glitch' | 'ryuk' | 'done' = 'gba-logo';
  let visible = true;

  onMount(() => {
    playGlitchBoot();

    // Phase 1: GBA logo (0-800ms)
    const glitchTimer = window.setTimeout(() => {
      phase = 'glitch';
    }, 800);

    // Phase 2: Glitch transition (800-1400ms)
    const ryukTimer = window.setTimeout(() => {
      phase = 'ryuk';
    }, 1400);

    // Phase 3: Ryuk reveal (1400-2800ms)
    const fadeTimer = window.setTimeout(() => {
      phase = 'done';
    }, 2800);

    // Phase 4: Remove from DOM
    const removeTimer = window.setTimeout(() => {
      visible = false;
    }, 3200);

    return () => {
      window.clearTimeout(glitchTimer);
      window.clearTimeout(ryukTimer);
      window.clearTimeout(fadeTimer);
      window.clearTimeout(removeTimer);
    };
  });
</script>

{#if visible}
  <div class="boot-overlay" class:phase-glitch={phase === 'glitch'} class:phase-ryuk={phase === 'ryuk'} class:phase-done={phase === 'done'} aria-hidden="true">
    
    <!-- Phase 1: GBA-style logo -->
    {#if phase === 'gba-logo'}
      <div class="gba-intro">
        <div class="gba-logo-text">
          <span class="gba-g">G</span><span class="gba-b">B</span><span class="gba-a">A</span>
        </div>
        <div class="tm-text">Game Boy Advance</div>
        <div class="nintendo-seal">♦</div>
      </div>
    {/if}

    <!-- Phase 2: Glitch transition -->
    {#if phase === 'glitch'}
      <div class="glitch-burst">
        <div class="tear tear-1"></div>
        <div class="tear tear-2"></div>
        <div class="tear tear-3"></div>
        <div class="tear tear-4"></div>
        <div class="tear tear-5"></div>
        <div class="chromatic-r">DEATH</div>
        <div class="chromatic-b">DEATH</div>
        <div class="chromatic-main">DEATH</div>
      </div>
    {/if}

    <!-- Phase 3: Ryuk silhouette reveal -->
    {#if phase === 'ryuk'}
      <div class="ryuk-reveal">
        <svg class="ryuk-silhouette" viewBox="0 0 120 140" xmlns="http://www.w3.org/2000/svg">
          <!-- Ryuk silhouette - stylized angular form -->
          <g class="ryuk-body">
            <!-- Head -->
            <ellipse cx="60" cy="28" rx="18" ry="22" fill="currentColor" />
            <!-- Wild hair spikes -->
            <path d="M42 20 L32 4 L44 16 L38 2 L48 14" fill="currentColor" />
            <path d="M78 20 L88 4 L76 16 L82 2 L72 14" fill="currentColor" />
            <path d="M54 8 L50 -4 L58 6 L56 -6 L62 6 L60 -4 L66 8" fill="currentColor" />
            <!-- Eyes - glowing -->
            <circle cx="52" cy="25" r="4" class="ryuk-eye" />
            <circle cx="68" cy="25" r="4" class="ryuk-eye" />
            <!-- Grin -->
            <path d="M48 34 Q54 42 60 34 Q66 42 72 34" stroke="currentColor" stroke-width="1.5" fill="none" class="ryuk-grin" />
            <!-- Neck -->
            <rect x="55" y="48" width="10" height="8" fill="currentColor" />
            <!-- Torso -->
            <path d="M40 56 L60 52 L80 56 L78 90 L42 90 Z" fill="currentColor" />
            <!-- Wings (angular, bat-like) -->
            <path d="M40 60 L18 40 L22 58 L8 48 L16 64 L6 62 L20 74 L38 78" fill="currentColor" class="ryuk-wing-l" />
            <path d="M80 60 L102 40 L98 58 L112 48 L104 64 L114 62 L100 74 L82 78" fill="currentColor" class="ryuk-wing-r" />
            <!-- Legs -->
            <path d="M42 90 L38 130 L48 130 L52 90" fill="currentColor" />
            <path d="M68 90 L72 130 L82 130 L78 90" fill="currentColor" />
          </g>
        </svg>
        <div class="ryuk-text">I am... a Shinigami.</div>
      </div>
    {/if}

    <!-- Persistent scan effects -->
    <div class="scan-line"></div>
    <div class="noise-layer"></div>
  </div>
{/if}

<style>
  .boot-overlay {
    position: absolute;
    inset: 0;
    z-index: 50;
    display: grid;
    place-items: center;
    background: #000;
    overflow: hidden;
  }

  .boot-overlay.phase-done {
    animation: boot-final-fade 400ms ease-out forwards;
  }

  /* ── GBA Logo Phase ── */
  .gba-intro {
    display: grid;
    place-items: center;
    gap: 4px;
    animation: gba-logo-enter 600ms cubic-bezier(0.17, 0.82, 0.32, 1.12) forwards;
  }

  .gba-logo-text {
    display: flex;
    gap: 3px;
    font-family: var(--font-pixel-heading, monospace);
    font-size: 18px;
    letter-spacing: 4px;
  }

  .gba-g { color: #6688cc; text-shadow: 0 0 6px rgba(100, 136, 204, 0.5); }
  .gba-b { color: #cc4444; text-shadow: 0 0 6px rgba(204, 68, 68, 0.5); }
  .gba-a { color: #44aa66; text-shadow: 0 0 6px rgba(68, 170, 102, 0.5); }

  .tm-text {
    font-family: var(--font-pixel, monospace);
    font-size: 5px;
    color: #888;
    letter-spacing: 1px;
    text-transform: uppercase;
  }

  .nintendo-seal {
    font-size: 6px;
    color: #666;
    margin-top: 2px;
    animation: seal-pulse 400ms ease-in-out 300ms 2 alternate;
  }

  /* ── Glitch Phase ── */
  .glitch-burst {
    position: absolute;
    inset: 0;
    display: grid;
    place-items: center;
    animation: glitch-shake 600ms steps(3, end) infinite;
  }

  .tear {
    position: absolute;
    left: 0;
    right: 0;
    height: 2px;
    background: rgba(255, 0, 0, 0.6);
    animation: tear-scroll 200ms steps(4, end) infinite;
  }

  .tear-1 { top: 15%; animation-delay: 0ms; background: rgba(255, 40, 40, 0.5); }
  .tear-2 { top: 35%; animation-delay: 40ms; background: rgba(0, 200, 255, 0.3); }
  .tear-3 { top: 55%; animation-delay: 80ms; background: rgba(255, 80, 80, 0.4); }
  .tear-4 { top: 72%; animation-delay: 30ms; background: rgba(200, 0, 0, 0.6); }
  .tear-5 { top: 88%; animation-delay: 60ms; background: rgba(0, 150, 255, 0.25); }

  .chromatic-r,
  .chromatic-b,
  .chromatic-main {
    position: absolute;
    font-family: var(--font-death-note, serif);
    font-size: 20px;
    letter-spacing: 2px;
    text-transform: uppercase;
  }

  .chromatic-r {
    color: rgba(255, 0, 0, 0.5);
    transform: translate(-2px, -1px);
    animation: chroma-drift-r 150ms steps(2, end) infinite;
  }

  .chromatic-b {
    color: rgba(60, 140, 220, 0.4);
    transform: translate(2px, 1px);
    animation: chroma-drift-b 180ms steps(2, end) infinite;
  }

  .chromatic-main {
    color: #e8e0e0;
    text-shadow: 0 0 12px rgba(200, 0, 0, 0.4);
    animation: chroma-flicker 100ms steps(2, end) infinite;
  }

  /* ── Ryuk Reveal Phase ── */
  .ryuk-reveal {
    display: grid;
    place-items: center;
    gap: 8px;
    animation: ryuk-fade-in 800ms ease-out forwards;
  }

  .ryuk-silhouette {
    width: 80px;
    height: 94px;
    color: #1a0a0a;
    filter: drop-shadow(0 0 8px rgba(200, 0, 0, 0.35)) drop-shadow(0 0 20px rgba(200, 0, 0, 0.15));
    animation: ryuk-float 1400ms ease-in-out infinite alternate;
  }

  .ryuk-eye {
    fill: #cc0000;
    filter: drop-shadow(0 0 3px rgba(255, 0, 0, 0.8));
    animation: eye-glow 600ms steps(2, end) infinite;
  }

  .ryuk-grin {
    stroke: #330000;
    animation: grin-draw 600ms ease-out 200ms forwards;
    stroke-dasharray: 60;
    stroke-dashoffset: 60;
  }

  .ryuk-wing-l {
    animation: wing-flap-l 1200ms ease-in-out infinite alternate;
    transform-origin: 40px 60px;
  }

  .ryuk-wing-r {
    animation: wing-flap-r 1200ms ease-in-out infinite alternate;
    transform-origin: 80px 60px;
  }

  .ryuk-text {
    font-family: var(--font-death-note, serif);
    font-size: 7px;
    color: #b89898;
    letter-spacing: 0.4px;
    text-shadow:
      0 0 6px rgba(200, 0, 0, 0.3),
      -0.5px 0 rgba(255, 0, 0, 0.3),
      0.5px 0 rgba(60, 140, 220, 0.2);
    animation: ryuk-text-in 600ms ease-out 400ms both;
  }

  /* ── Persistent Effects ── */
  .scan-line {
    position: absolute;
    left: 0;
    right: 0;
    height: 2px;
    background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.06), transparent);
    animation: scan-sweep 1200ms linear infinite;
    pointer-events: none;
  }

  .noise-layer {
    position: absolute;
    inset: 0;
    background:
      repeating-linear-gradient(
        0deg,
        transparent 0,
        transparent 1px,
        rgba(255, 255, 255, 0.008) 1px,
        rgba(255, 255, 255, 0.008) 2px
      );
    pointer-events: none;
    opacity: 0.6;
    animation: noise-shift 80ms steps(4, end) infinite;
  }

  /* ── Keyframes ── */
  @keyframes gba-logo-enter {
    0% { opacity: 0; transform: translateY(-20px) scale(0.8); }
    60% { opacity: 1; transform: translateY(2px) scale(1.02); }
    100% { transform: translateY(0) scale(1); }
  }

  @keyframes seal-pulse {
    0% { opacity: 0.4; }
    100% { opacity: 1; }
  }

  @keyframes glitch-shake {
    0% { transform: translate(0, 0); }
    33% { transform: translate(-1px, 0.5px); }
    66% { transform: translate(1.5px, -0.5px); }
    100% { transform: translate(-0.5px, 0); }
  }

  @keyframes tear-scroll {
    0% { transform: translateX(0) scaleX(1); opacity: 0.8; }
    50% { transform: translateX(3px) scaleX(1.5); opacity: 0.4; }
    100% { transform: translateX(-2px) scaleX(0.8); opacity: 0.9; }
  }

  @keyframes chroma-drift-r {
    0% { transform: translate(-2px, -1px); }
    50% { transform: translate(-1px, 0.5px); }
    100% { transform: translate(-3px, -0.5px); }
  }

  @keyframes chroma-drift-b {
    0% { transform: translate(2px, 1px); }
    50% { transform: translate(1px, -0.5px); }
    100% { transform: translate(3px, 0.5px); }
  }

  @keyframes chroma-flicker {
    0%, 90% { opacity: 1; }
    50% { opacity: 0.7; }
  }

  @keyframes ryuk-fade-in {
    0% { opacity: 0; transform: scale(0.85); filter: brightness(2) blur(2px); }
    40% { opacity: 1; filter: brightness(1.2) blur(0); }
    100% { transform: scale(1); filter: brightness(1) blur(0); }
  }

  @keyframes ryuk-float {
    0% { transform: translateY(0); }
    100% { transform: translateY(-3px); }
  }

  @keyframes eye-glow {
    0%, 60% { fill: #cc0000; opacity: 1; }
    61%, 100% { fill: #ff3333; opacity: 0.7; }
  }

  @keyframes grin-draw {
    to { stroke-dashoffset: 0; }
  }

  @keyframes wing-flap-l {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(-4deg); }
  }

  @keyframes wing-flap-r {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(4deg); }
  }

  @keyframes ryuk-text-in {
    0% { opacity: 0; transform: translateY(4px); letter-spacing: 2px; }
    100% { opacity: 1; transform: translateY(0); letter-spacing: 0.4px; }
  }

  @keyframes scan-sweep {
    0% { top: -2px; }
    100% { top: 100%; }
  }

  @keyframes noise-shift {
    0% { transform: translate(0, 0); }
    25% { transform: translate(-1px, 0); }
    50% { transform: translate(0, 1px); }
    75% { transform: translate(1px, -1px); }
    100% { transform: translate(0, 0); }
  }

  @keyframes boot-final-fade {
    0% { opacity: 1; }
    60% { opacity: 1; filter: brightness(1.4) saturate(0.6); }
    100% { opacity: 0; visibility: hidden; }
  }
</style>
