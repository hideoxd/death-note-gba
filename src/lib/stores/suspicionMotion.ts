import { spring } from 'svelte/motion';

import { gameState } from '$lib/stores/gameState';

const suspenseSpring = spring(0, {
  stiffness: 0.2,
  damping: 0.6,
  precision: 0.01
});

let previous = 0;

gameState.subscribe((state) => {
  const next = Math.round(state.suspicion.meter);

  if (Math.abs(next - previous) >= 8) {
    suspenseSpring.set(next + 7, { hard: true });
    suspenseSpring.set(next);
  } else {
    suspenseSpring.set(next);
  }

  previous = next;
});

export const suspenseMeterMotion = suspenseSpring;
