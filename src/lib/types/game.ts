export type GameMode = 'anime-canon' | 'divergent';
export type TimeBlock = 'morning' | 'afternoon' | 'night';
export type Phase = 'title' | 'playing' | 'paused' | 'ending' | 'game-over';
export type DeathCause = 'heart-attack' | 'accident' | 'poisoning' | 'suicide';
export type FaceIntelSource = 'news-clip' | 'social-feed' | null;
export type InvestigationRegion = 'kanto' | 'kansai' | 'tohoku' | 'kyushu';

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
  willpower: number;
}

export interface InvestigationTarget {
  id: string;
  alias: string;
  trueName: string;
  region: InvestigationRegion;
  isDecoy: boolean;
  knownName: boolean;
  knownFace: boolean;
  faceSource: FaceIntelSource;
  eliminated: boolean;
}

export interface EliminationRecord {
  targetId: string;
  alias: string;
  trueName: string;
  region: InvestigationRegion;
  decoy?: boolean;
  cause: DeathCause;
  day: number;
  block: TimeBlock;
}

export interface InvestigationState {
  activeTargetIndex: number;
  selectedCause: DeathCause;
  targets: InvestigationTarget[];
  eliminationLog: EliminationRecord[];
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
  investigation: InvestigationState;
  narrative: NarrativeState;
  canon: CanonState;
  log: LogEntry[];
  gameOver: GameOverState | null;
}
