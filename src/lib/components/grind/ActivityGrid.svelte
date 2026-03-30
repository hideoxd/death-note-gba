<script lang="ts">
  import ActivityCard from '$lib/components/grind/ActivityCard.svelte';
  import { activityOptions } from '$lib/stores/selectors';
</script>

<section class="activity-grid" aria-label="Grind activities">
  {#each $activityOptions as activity, i}
    <div class="card-wrapper" style="animation-delay:{i * 50}ms">
      <ActivityCard {activity} />
    </div>
  {/each}
</section>

<style>
  .activity-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 3px;
    align-items: stretch;
  }

  .card-wrapper {
    animation: card-in 200ms ease-out both;
  }

  @keyframes card-in {
    from { opacity: 0; transform: translateY(3px); }
    to { opacity: 1; transform: translateY(0); }
  }
</style>
