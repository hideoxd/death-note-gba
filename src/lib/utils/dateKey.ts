import type { GameClock } from '$lib/types/game';

export const dateKey = (clock: GameClock): string => {
  const day = String(clock.day).padStart(2, '0');
  const month = String(clock.month).padStart(2, '0');
  return `${clock.year}-${month}-${day}-${clock.block}`;
};
