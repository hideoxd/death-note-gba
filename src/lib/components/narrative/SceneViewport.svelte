<script lang="ts">
  import { currentNode, unreachableCurrentNode } from '$lib/stores/selectors';
  import DialogueBox from '$lib/components/narrative/DialogueBox.svelte';
  import ChoiceList from '$lib/components/narrative/ChoiceList.svelte';
  import PortraitPanel from '$lib/components/narrative/PortraitPanel.svelte';

  $: speaker = $currentNode?.speaker ?? 'system';
  $: portrait = $currentNode?.portrait ?? 'default';
  $: text = $currentNode?.text ?? ['No narrative node active.'];
  $: location = $currentNode?.location ?? 'unknown location';
</script>

<section class="scene-root">
  <header>
    <span class="loc-icon">◆</span>
    <p>{location}</p>
  </header>

  <div class="scene-content">
    <PortraitPanel {speaker} {portrait} />

    <div class="dialogue-column">
      <DialogueBox {text} />
      {#if $unreachableCurrentNode}
        <p class="notice">⚠ Gate locked.</p>
      {/if}
      <ChoiceList />
    </div>
  </div>
</section>

<style>
  .scene-root {
    display: grid;
    gap: 2px;
    padding: 2px;
    border: 1px solid rgba(200, 0, 0, 0.12);
    background: linear-gradient(180deg, rgba(14, 8, 12, 0.96) 0%, rgba(10, 6, 10, 0.9) 100%);
    flex-shrink: 0;
    min-width: 0;
  }

  header {
    display: flex;
    align-items: center;
    gap: 2px;
    padding: 1px 3px;
    background: linear-gradient(90deg, rgba(40, 15, 15, 0.4), transparent);
  }

  .loc-icon {
    font-size: 3px;
    color: #cc0000;
  }

  header p {
    margin: 0;
    font-size: 5px;
    letter-spacing: 0.06em;
    text-transform: uppercase;
    color: #908080;
    font-family: var(--font-pixel, monospace);
  }

  .scene-content {
    display: grid;
    grid-template-columns: 40px 1fr;
    gap: 2px;
    min-width: 0;
  }

  .dialogue-column {
    display: grid;
    gap: 2px;
    min-width: 0;
  }

  .notice {
    margin: 0;
    font-size: 4px;
    color: #cc6666;
    font-family: var(--font-pixel, monospace);
  }
</style>
