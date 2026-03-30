import activitiesJson from '$lib/data/activities.json';
import canonMilestonesJson from '$lib/data/canon-milestones.json';
import suspicionRulesJson from '$lib/data/suspicion-rules.json';
import canonEpisode01Json from '$lib/data/narrative/canon/episode-01.json';
import canonEpisode02Json from '$lib/data/narrative/canon/episode-02.json';
import canonEpisode03Json from '$lib/data/narrative/canon/episode-03.json';
import divergentChapter01Json from '$lib/data/narrative/divergent/chapter-01.json';
import divergentChapter02Json from '$lib/data/narrative/divergent/chapter-02.json';

import type { ActivityDefinition, CanonMilestoneDefinition } from '$lib/types/data';
import type { DialogueTree } from '$lib/types/narrative';

export const ACTIVITIES = activitiesJson as ActivityDefinition[];
export const CANON_MILESTONES = canonMilestonesJson as CanonMilestoneDefinition[];
export const SUSPICION_RULES = suspicionRulesJson as {
  baseDecayPerBlock: number;
  minMeter: number;
  maxMeter: number;
  thresholds: {
    watchlist: number;
    activeInvestigation: number;
    captureRisk: number;
  };
  weights: {
    intelSpike: number;
    executionPattern: number;
    normalRoutine: number;
    socialCover: number;
    mistakePenalty: number;
  };
};

export const DIALOGUE_TREES: Record<string, DialogueTree> = {
  [canonEpisode01Json.meta.id]: canonEpisode01Json as DialogueTree,
  [canonEpisode02Json.meta.id]: canonEpisode02Json as DialogueTree,
  [canonEpisode03Json.meta.id]: canonEpisode03Json as DialogueTree,
  [divergentChapter01Json.meta.id]: divergentChapter01Json as DialogueTree,
  [divergentChapter02Json.meta.id]: divergentChapter02Json as DialogueTree
};

export const DEFAULT_TREE_BY_MODE = {
  'anime-canon': canonEpisode01Json.meta.id,
  divergent: divergentChapter01Json.meta.id
} as const;
