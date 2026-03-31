import { CANON_MILESTONES, DEFAULT_TREE_BY_MODE, DIALOGUE_TREES } from '$lib/data';
import { createInitialSuspicionBreakdown } from '$lib/engine/suspicion';
import type { GameMode, GameState, InvestigationRegion, Phase } from '$lib/types/game';

const regionByIndex: InvestigationRegion[] = ['kanto', 'kansai', 'tohoku', 'kyushu'];

const investigationTargetSeed: GameState['investigation']['targets'] = [
  {
    id: 'target-01',
    alias: 'Bus Hijacker Suspect',
    trueName: 'Daiki Hamura',
    region: regionByIndex[0],
    isDecoy: false,
    knownName: false,
    knownFace: false,
    faceSource: null,
    eliminated: false
  },
  {
    id: 'target-02',
    alias: 'Corporate Bribe Broker',
    trueName: 'Kenta Moroboshi',
    region: regionByIndex[1],
    isDecoy: false,
    knownName: false,
    knownFace: false,
    faceSource: null,
    eliminated: false
  },
  {
    id: 'target-03',
    alias: 'Serial Extortion Caller',
    trueName: 'Riku Kasahara',
    region: regionByIndex[2],
    isDecoy: true,
    knownName: false,
    knownFace: false,
    faceSource: null,
    eliminated: false
  },
  {
    id: 'target-04',
    alias: 'Arson Ring Planner',
    trueName: 'Shota Mikuni',
    region: regionByIndex[3],
    isDecoy: false,
    knownName: false,
    knownFace: false,
    faceSource: null,
    eliminated: false
  }
];

const relationshipSeed = {
  l: { trust: -10, suspicion: 12, affinity: -20 },
  ryuk: { trust: 0, suspicion: 0, affinity: 15 },
  sayu: { trust: 35, suspicion: 0, affinity: 30 }
} as const;

const defaultFlags = {
  first_execution_done: false,
  l_challenge_accepted: false,
  joined_taskforce: false,
  surveillance_evaded: false,
  canon_episode_02_started: false,
  canon_episode_03_started: false,
  canon_route_stable: false,
  raye_identified: false,
  raye_controlled: false,
  raye_executed: false,
  misa_second_kira_active: false,
  misa_controlled: false,
  memory_plan_executed: false,
  higuchi_captured: false,
  yotsuba_arc_active: false,
  l_dead: false,
  rem_dead: false,
  timeskip_started: false,
  mikami_proxy_active: false,
  takada_channel_established: false,
  mello_interference: false,
  yellow_box_triggered: false,
  light_dead: false,
  investigation_wave: 1,
  dual_mode: 'kira',
  shinigami_eye_active: false,
  pending_cause_target: '',
  pending_cause_blocks: 0,
  pending_cause_deadline_ms: 0,
  suspicion_alert_seq: 0,
  suspicion_alert_reason: '',
  death_flash_seq: 0,
  world_opinion: 0,
  divergent_ch2_started: false,
  divergent_ch2_complete: false,
  false_channels: false,
  kira_manifesto: false,
  found_notebook: false
} as const;

const cloneRelationshipSeed = (): GameState['relationships'] => ({
  l: { ...relationshipSeed.l },
  ryuk: { ...relationshipSeed.ryuk },
  sayu: { ...relationshipSeed.sayu }
});

const cloneInvestigationTargets = (): GameState['investigation']['targets'] =>
  investigationTargetSeed.map((target) => ({ ...target }));

const buildMilestoneState = (): GameState['canon']['milestoneState'] => {
  const entries = CANON_MILESTONES.map((milestone) => [milestone.id, 'locked'] as const);
  return Object.fromEntries(entries);
};

const createSeed = (): string => {
  if (globalThis.crypto?.randomUUID) {
    return globalThis.crypto.randomUUID();
  }

  return `${Date.now()}-${Math.round(Math.random() * 1000000)}`;
};

export const createInitialGameState = (
  mode: GameMode = 'anime-canon',
  phase: Phase = 'title'
): GameState => {
  const activeTreeId = DEFAULT_TREE_BY_MODE[mode];
  const tree = DIALOGUE_TREES[activeTreeId];
  const firstMilestone = CANON_MILESTONES[0]?.id ?? null;
  const milestoneState = buildMilestoneState();

  if (mode === 'anime-canon' && firstMilestone) {
    milestoneState[firstMilestone] = 'active';
  }

  return {
    version: 2,
    seed: createSeed(),
    mode,
    phase,
    clock: {
      day: 1,
      week: 1,
      month: 11,
      year: 2003,
      block: 'morning',
      totalBlocksElapsed: 0
    },
    stats: {
      alibi: 0,
      intel: 0,
      morality: 0,
      stress: 0,
      willpower: 72
    },
    suspicion: {
      meter: 0,
      trend: 0,
      breakdown: createInitialSuspicionBreakdown()
    },
    actionEconomy: {
      actionsPerBlock: 2,
      actionsRemaining: 2
    },
    inventory: {
      notebookPages: 60,
      hasShinigamiEyes: false,
      money: 5000
    },
    relationships: cloneRelationshipSeed(),
    flags: { ...defaultFlags },
    investigation: {
      activeTargetIndex: 0,
      selectedCause: 'heart-attack',
      targets: cloneInvestigationTargets(),
      eliminationLog: []
    },
    narrative: {
      activeTreeId,
      currentNodeId: tree.meta.startNodeId,
      seenNodeIds: [],
      choiceHistory: [],
      eventQueue: []
    },
    canon: {
      fractured: false,
      activeMilestoneId: mode === 'anime-canon' ? firstMilestone : null,
      milestoneState,
      failureReason: null
    },
    log: [],
    gameOver: null
  };
};
