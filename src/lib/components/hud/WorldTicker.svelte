<script lang="ts">
  import { worldTimeline } from '$lib/stores/timeline';

  const toneClass = (tone: string): string => {
    if (tone === 'critical') return 'critical';
    if (tone === 'danger') return 'danger';
    if (tone === 'urgent') return 'urgent';
    return 'neutral';
  };
</script>

<section class="ticker" aria-label="World timeline ticker">
  <div class="track">
    <div class="loop">
      {#each [...$worldTimeline, ...$worldTimeline] as entry}
        <span class="item {toneClass(entry.tone)}">
          <strong>{entry.headline}</strong>
          <span>{entry.detail}</span>
        </span>
      {/each}
    </div>
  </div>
</section>

<style>
  .ticker {
    height: 10px;
    border-top: 1px solid rgba(200, 0, 0, 0.22);
    border-bottom: 1px solid rgba(200, 0, 0, 0.12);
    background: linear-gradient(180deg, rgba(15, 7, 9, 0.96) 0%, rgba(10, 5, 7, 0.96) 100%);
    overflow: hidden;
    flex-shrink: 0;
  }

  .track {
    width: 100%;
    height: 100%;
    overflow: hidden;
  }

  .loop {
    min-width: max-content;
    height: 100%;
    display: inline-flex;
    align-items: center;
    gap: 14px;
    padding: 0 10px;
    animation: ticker-scroll 34s linear infinite;
  }

  .item {
    display: inline-flex;
    align-items: center;
    gap: 3px;
    font-family: var(--font-pixel, monospace);
    font-size: 4px;
    letter-spacing: 0.2px;
    white-space: nowrap;
    text-transform: uppercase;
    color: #847777;
  }

  .item strong {
    font-weight: 400;
    color: #b89898;
  }

  .item.urgent {
    color: #a5846c;
  }

  .item.danger {
    color: #bf7272;
  }

  .item.critical {
    color: #e05f5f;
  }

  @keyframes ticker-scroll {
    from {
      transform: translateX(0);
    }
    to {
      transform: translateX(-50%);
    }
  }
</style>
