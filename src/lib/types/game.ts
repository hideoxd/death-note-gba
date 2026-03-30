export type GameMode = 'anime-canon' | 'divergent';
export type TimeBlock = 'morning' | 'afternoon' | 'night';
export type Phase = 'title' | 'playing' | 'paused' | 'ending' | 'game-over';

export interface GameClock {
  day: number;
  week: number;
  month: number;
  year: number;
  block: TimeBlock;
  totalBlocksElapsed: number;
}

export interface PlayerStats {
  alibi: number;
  intel: number;
  morality: number;
  stress: number;
}

export interface SuspicionBreakdown {
  patternRisk: number;
  socialCover: number;
  policeHeat: number;
  mistakes: number;
}

export interface SuspicionState {
  meter: number;
  trend: number;
  breakdown: SuspicionBreakdown;
}

export type MilestoneStatus = 'locked' | 'active' | 'completed' | 'failed';

export interface CanonState {
  fractured: boolean;
  activeMilestoneId: string | null;
  milestoneState: Record<string, MilestoneStatus>;
  failureReason: string | null;
}

export interface NarrativeChoiceLog {
  nodeId: string;
  choiceId: string;
  day: number;
  block: TimeBlock;
}

export interface NarrativeState {
  activeTreeId: string;
  currentNodeId: string;
  seenNodeIds: string[];
  choiceHistory: NarrativeChoiceLog[];
  eventQueue: string[];
}

export interface RelationshipState {
  trust: number;
  suspicion: number;
  affinity: number;
}

export type GameOverReason = 'suspicion-max' | 'canon-failure' | 'captured' | 'ending';

export interface GameOverState {
  reason: GameOverReason;
  detail?: string;
  day: number;
  block: TimeBlock;
}

export interface LogEntry {
  id: string;
  kind: 'system' | 'action' | 'story';
  text: string;
  day: number;
  block: TimeBlock;
}

export interface GameState {
  version: number;
  seed: string;
  mode: GameMode;
  phase: Phase;
  clock: GameClock;
  stats: PlayerStats;
  suspicion: SuspicionState;
  actionEconomy: {
    actionsPerBlock: number;
    actionsRemaining: number;
  };
  inventory: {
    notebookPages: number;
    hasShinigamiEyes: boolean;
    money: number;
  };
  relationships: Record<string, RelationshipState>;
  flags: Record<string, boolean | number | string>;
  narrative: NarrativeState;
  canon: CanonState;
  log: LogEntry[];
  gameOver: GameOverState | null;
}
