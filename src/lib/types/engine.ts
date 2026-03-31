import type { Effect } from '$lib/types/narrative';
import type { DeathCause, GameMode, TimeBlock } from '$lib/types/game';

export type GameAction =
  | { type: 'START_NEW_GAME'; mode: GameMode }
  | { type: 'SET_PHASE'; phase: 'title' | 'playing' | 'paused' | 'ending' | 'game-over' }
  | { type: 'ADVANCE_TIME'; blocks?: number }
  | { type: 'CONTINUE_NODE' }
  | { type: 'PERFORM_ACTIVITY'; activityId: string }
  | { type: 'WRITE_JUDGMENT' }
  | { type: 'INVESTIGATE_TARGET_NAME' }
  | { type: 'INVESTIGATE_TARGET_FACE'; source: 'news-clip' | 'social-feed' }
  | { type: 'SELECT_INVESTIGATION_TARGET'; index: number }
  | { type: 'SET_JUDGMENT_CAUSE'; cause: DeathCause }
  | { type: 'SELECT_CHOICE'; choiceId: string }
  | { type: 'APPLY_EFFECTS'; effects: Effect[] }
  | {
      type: 'SET_NODE';
      treeId?: string;
      nodeId: string;
      addSeen?: boolean;
    }
  | {
      type: 'PUSH_LOG';
      kind: 'system' | 'action' | 'story';
      text: string;
      day?: number;
      block?: TimeBlock;
    }
  | {
      type: 'TRIGGER_GAME_OVER';
      reason: 'suspicion-max' | 'canon-failure' | 'captured' | 'ending';
      detail?: string;
    }
  | {
      type: 'UPDATE_MILESTONE';
      milestoneId: string;
      status: 'locked' | 'active' | 'completed' | 'failed';
      setActive?: boolean;
    };
