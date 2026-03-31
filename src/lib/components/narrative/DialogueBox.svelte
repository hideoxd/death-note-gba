<script lang="ts">
  import { onDestroy } from 'svelte';

  import { playTextBlip } from '$lib/utils/sfx';

  export let text: string[] = [];

  const CHAR_DELAY_MS = 14;
  const LINE_BREAK = '\n';

  let renderedText = '';
  let targetText = '';
  let previousTargetText = '';
  let charIndex = 0;
  let typerTimer: ReturnType<typeof setInterval> | null = null;

  const stopTyping = () => {
    if (!typerTimer) return;
    clearInterval(typerTimer);
    typerTimer = null;
  };

  const startTyping = () => {
    stopTyping();
    renderedText = '';
    charIndex = 0;

    if (!targetText) {
      return;
    }

    typerTimer = setInterval(() => {
      if (charIndex >= targetText.length) {
        stopTyping();
        return;
      }

      const nextChar = targetText[charIndex];
      renderedText += nextChar;

      if (nextChar !== ' ' && nextChar !== '\n') {
        playTextBlip();
      }

      charIndex += 1;
    }, CHAR_DELAY_MS);
  };

  $: targetText = text.length > 0 ? text.join(LINE_BREAK) : '';
  $: if (targetText !== previousTargetText) {
    previousTargetText = targetText;
    startTyping();
  }

  onDestroy(() => {
    stopTyping();
  });
</script>

<section class="dialogue-box" aria-live="polite">
  {#if targetText.length === 0}
    <p class="empty">...</p>
  {:else}
    <p class="typed">{renderedText}<span class="caret"></span></p>
  {/if}
  <div class="cursor-blink">▼</div>
</section>

<style>
  .dialogue-box {
    min-height: 28px;
    padding: 3px 5px 7px;
    border: 1px solid rgba(200, 0, 0, 0.15);
    background: linear-gradient(180deg, rgba(12, 6, 8, 0.98) 0%, rgba(8, 4, 6, 0.98) 100%);
    display: grid;
    align-content: start;
    gap: 1px;
    position: relative;
    box-shadow: inset 0 0 8px rgba(0, 0, 0, 0.5);
    min-width: 0;
  }

  /* Corner accents */
  .dialogue-box::before,
  .dialogue-box::after {
    content: '';
    position: absolute;
    width: 3px;
    height: 3px;
    border-color: rgba(200, 0, 0, 0.25);
    border-style: solid;
  }

  .dialogue-box::before {
    top: 1px;
    left: 1px;
    border-width: 1px 0 0 1px;
  }

  .dialogue-box::after {
    bottom: 1px;
    right: 1px;
    border-width: 0 1px 1px 0;
  }

  p {
    margin: 0;
    font-size: 6px;
    font-family: var(--font-vt, 'VT323', monospace);
    line-height: 1.4;
    color: #d0c8c8;
    text-shadow: 1px 1px 0 rgba(0, 0, 0, 0.8);
    white-space: pre-wrap;
    overflow-wrap: anywhere;
  }

  .typed {
    min-height: 16px;
  }

  .caret {
    display: inline-block;
    width: 1px;
    height: 7px;
    margin-left: 1px;
    background: rgba(210, 190, 190, 0.85);
    vertical-align: -1px;
    animation: type-caret 400ms steps(1, end) infinite;
  }

  @keyframes type-caret {
    0%, 49% {
      opacity: 1;
    }
    50%, 100% {
      opacity: 0;
    }
  }

  .empty {
    color: #403838;
  }

  .cursor-blink {
    position: absolute;
    bottom: 1px;
    right: 3px;
    font-size: 4px;
    color: rgba(200, 0, 0, 0.35);
    animation: blink 1s steps(2, end) infinite;
  }

  @keyframes blink {
    0%, 49% { opacity: 1; }
    50%, 100% { opacity: 0; }
  }
</style>
