import { cubicOut } from 'svelte/easing';
import { tweened } from 'svelte/motion';

import { gameState } from '$lib/stores/gameState';

const suspenseTween = tweened(0, {
  duration: 260,
  easing: cubicOut
});

let previous = 0;

gameState.subscribe((state) => {
  const next = Math.round(state.suspicion.meter);
  const delta = Math.abs(next - previous);
  const duration = Math.max(170, Math.min(760, 180 + delta * 22));

  suspenseTween.set(next, {
    duration,
    easing: cubicOut
  });

  previous = next;
});

export const suspenseMeterMotion = suspenseTween;
