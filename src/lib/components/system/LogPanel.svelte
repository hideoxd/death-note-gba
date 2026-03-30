<script lang="ts">
  import { recentLog } from '$lib/stores/selectors';
</script>

<section class="log-panel">
  <h3>▤ LOG</h3>
  {#if $recentLog.length === 0}
    <p class="empty">No entries.</p>
  {:else}
    <ul>
      {#each $recentLog.slice(0, 3) as entry}
        <li>
          <span class="tag">[{entry.day}:{entry.block.slice(0, 1)}]</span>
          <span class="text">{entry.text}</span>
        </li>
      {/each}
    </ul>
  {/if}
</section>

<style>
  .log-panel {
    display: grid;
    gap: 1px;
    padding: 3px 4px;
    border: 1px solid rgba(200, 0, 0, 0.2);
    background: linear-gradient(180deg, rgba(18, 10, 12, 0.95) 0%, rgba(10, 6, 8, 0.95) 100%);
    box-shadow: inset 0 0 6px rgba(0, 0, 0, 0.5);
    flex-shrink: 0;
    overflow: hidden;
  }

  h3 {
    margin: 0;
    font-size: 5px;
    font-family: var(--font-pixel, monospace);
    color: #cc0000;
    letter-spacing: 0.5px;
    text-shadow: 0 0 3px rgba(200, 0, 0, 0.3);
  }

  ul {
    margin: 0;
    padding: 0;
    list-style: none;
    display: grid;
    gap: 1px;
  }

  li {
    display: flex;
    gap: 2px;
    font-size: 4px;
    font-family: var(--font-pixel, monospace);
    line-height: 1.2;
  }

  .tag {
    color: #605858;
    white-space: nowrap;
    flex-shrink: 0;
  }

  .text {
    color: #908080;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .empty {
    margin: 0;
    font-size: 4px;
    font-family: var(--font-pixel, monospace);
    color: #504848;
  }
</style>
