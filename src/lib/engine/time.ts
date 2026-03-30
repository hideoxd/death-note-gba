import type { GameClock, TimeBlock } from '$lib/types/game';

const BLOCK_ORDER: TimeBlock[] = ['morning', 'afternoon', 'night'];

export const advanceClock = (clock: GameClock, blocks = 1): GameClock => {
  if (blocks <= 0) return clock;

  let day = clock.day;
  let week = clock.week;
  const month = clock.month;
  const year = clock.year;
  let currentIndex = BLOCK_ORDER.indexOf(clock.block);
  let totalBlocksElapsed = clock.totalBlocksElapsed;

  for (let i = 0; i < blocks; i += 1) {
    totalBlocksElapsed += 1;
    currentIndex += 1;

    if (currentIndex >= BLOCK_ORDER.length) {
      currentIndex = 0;
      day += 1;
      if ((day - 1) % 7 === 0) {
        week += 1;
      }
    }
  }

  return {
    day,
    week,
    month,
    year,
    block: BLOCK_ORDER[currentIndex],
    totalBlocksElapsed
  };
};
