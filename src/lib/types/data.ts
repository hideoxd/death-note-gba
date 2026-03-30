import type { TimeBlock } from '$lib/types/game';
import type { Effect, Requirement } from '$lib/types/narrative';

export interface ActivityDefinition {
  id: string;
  label: string;
  description: string;
  tutorialHint?: string;
  requirements?: Requirement[];
  effects: Effect[];
  tags?: string[];
}

export interface CanonMilestoneDefinition {
  id: string;
  label: string;
  window: {
    dayMin: number;
    dayMax: number;
    blocks: TimeBlock[];
  };
  requiredFlags: string[];
  onFail: {
    fracture: boolean;
    reason: string;
  };
}
