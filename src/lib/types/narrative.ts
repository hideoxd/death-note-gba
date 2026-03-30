import type { GameMode, MilestoneStatus, TimeBlock } from '$lib/types/game';

export type RequirementOperator = '=' | '!=' | '>' | '>=' | '<' | '<=';

export type Requirement =
  | {
      type: 'compare';
      path: string;
      op: RequirementOperator;
      value: number | string | boolean;
    }
  | {
      type: 'flag.is';
      key: string;
      value: number | string | boolean;
    }
  | {
      type: 'mode.is';
      value: GameMode;
    }
  | {
      type: 'time.window';
      dayMin?: number;
      dayMax?: number;
      blocks?: TimeBlock[];
    }
  | {
      type: 'milestone.state';
      milestoneId: string;
      state: MilestoneStatus;
    }
  | {
      type: 'relationship.compare';
      characterId: string;
      metric: 'trust' | 'suspicion' | 'affinity';
      op: RequirementOperator;
      value: number;
    };

export type Effect =
  | {
      type: 'stat.add';
      path: 'stats.alibi' | 'stats.intel' | 'stats.morality' | 'stats.stress';
      value: number;
    }
  | {
      type: 'stat.set';
      path: 'stats.alibi' | 'stats.intel' | 'stats.morality' | 'stats.stress';
      value: number;
    }
  | {
      type: 'suspicion.add';
      value: number;
      reason?: string;
    }
  | {
      type: 'flag.set';
      key: string;
      value: number | string | boolean;
    }
  | {
      type: 'relationship.add';
      characterId: string;
      metric: 'trust' | 'suspicion' | 'affinity';
      value: number;
    }
  | {
      type: 'time.advance';
      blocks: number;
    }
  | {
      type: 'milestone.complete';
      milestoneId: string;
    }
  | {
      type: 'node.jump';
      nodeId: string;
    }
  | {
      type: 'gameover.trigger';
      reason: 'suspicion-max' | 'canon-failure' | 'captured' | 'ending';
      detail?: string;
    };

export type DialogueNodeType = 'scene' | 'choice' | 'event' | 'system';

export interface DialogueChoice {
  id: string;
  label: string;
  requirements?: Requirement[];
  effects?: Effect[];
  next: string;
}

export interface CanonConstraint {
  milestoneId: string;
  deadline: {
    day: number;
    block: TimeBlock;
  };
  failureNodeId: string;
}

export interface DialogueNode {
  id: string;
  type: DialogueNodeType;
  speaker?: string;
  portrait?: string;
  location?: string;
  text: string[];
  requirements?: Requirement[];
  onEnter?: Effect[];
  choices?: DialogueChoice[];
  next?: string | null;
  canon?: CanonConstraint;
  tags?: string[];
}

export interface DialogueTree {
  meta: {
    id: string;
    version: number;
    mode: GameMode;
    startNodeId: string;
  };
  nodes: Record<string, DialogueNode>;
}
