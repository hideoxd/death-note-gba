import { ACTIVITIES } from '$lib/data';
import { evaluateCanonTimeline } from '$lib/engine/canon';
import { evaluateRequirements, listUnmetRequirements } from '$lib/engine/conditions';
import { getCurrentNode, getDialogueTree, visitNode } from '$lib/engine/dialogue';
import { applyEffects } from '$lib/engine/effects';
import { evaluateStoryProgression } from '$lib/engine/progression';
import { createInitialGameState } from '$lib/engine/stateFactory';
import { applySuspicionDelta, recalculateSuspicion } from '$lib/engine/suspicion';
import { advanceClock } from '$lib/engine/time';
import { clamp } from '$lib/utils/clamp';
import type { GameAction } from '$lib/types/engine';
import type { DeathCause, GameState, InvestigationRegion, TimeBlock } from '$lib/types/game';

const createLogId = (state: GameState): string => {
  return `${state.clock.totalBlocksElapsed}-${state.log.length + 1}`;
};

const pushLog = (
  state: GameState,
  kind: 'system' | 'action' | 'story',
  text: string,
  day = state.clock.day,
  block: TimeBlock = state.clock.block
): GameState => {
  return {
    ...state,
    log: [
      ...state.log,
      {
        id: createLogId(state),
        kind,
        text,
        day,
        block
      }
    ]
  };
};

const deathCauseLabels: Record<DeathCause, string> = {
  'heart-attack': 'Heart Attack',
  accident: 'Accident',
  poisoning: 'Poisoning',
  suicide: 'Forced Suicide'
};

const deathCauseIntelCost: Record<DeathCause, number> = {
  'heart-attack': 2,
  accident: 3,
  poisoning: 3,
  suicide: 4
};

const deathCauseWillpowerCost: Record<DeathCause, number> = {
  'heart-attack': 14,
  accident: 18,
  poisoning: 20,
  suicide: 22
};

const deathCauseMoralityCost: Record<DeathCause, number> = {
  'heart-attack': 3,
  accident: 4,
  poisoning: 5,
  suicide: 6
};

const deathCauseStressGain: Record<DeathCause, number> = {
  'heart-attack': 1,
  accident: 2,
  poisoning: 3,
  suicide: 4
};

const deathCauseSuspicionDelta: Record<DeathCause, number> = {
  'heart-attack': 4,
  accident: 5,
  poisoning: 6,
  suicide: 7
};

const regionBiasOrder: InvestigationRegion[] = ['kanto', 'kansai', 'tohoku', 'kyushu'];
const regionalSpikePenalty = 3;
const causeTimeoutBlocks = 2;

const targetAliasPool = [
  'Insider Trading Broker',
  'Counterfeit Passport Runner',
  'Kidnapping Coordinator',
  'Arms Auction Facilitator',
  'Serial Fraud Architect',
  'Violent Loan Shark',
  'Blackmail Syndicate Fixer',
  'Organized Arson Contact'
];

const targetNamePool = [
  'Koji Imanishi',
  'Ren Takigawa',
  'Atsushi Kudo',
  'Yuto Nishimori',
  'Takumi Hasebe',
  'Shunpei Odawara',
  'Naoki Ishizuka',
  'Keita Minagawa'
];

const buildTargetWave = (wave: number): GameState['investigation']['targets'] => {
  const count = 4;

  return Array.from({ length: count }, (_, index) => {
    const alias = targetAliasPool[(wave + index - 1) % targetAliasPool.length];
    const trueName = targetNamePool[(wave * 2 + index - 1) % targetNamePool.length];
    const region = regionBiasOrder[(wave + index - 1) % regionBiasOrder.length];

    return {
      id: `wave-${wave}-target-${index + 1}`,
      alias,
      trueName,
      region,
      knownName: false,
      knownFace: false,
      faceSource: null,
      eliminated: false
    };
  });
};

const getRecentRegionalEliminations = (state: GameState, region: InvestigationRegion): number => {
  return state.investigation.eliminationLog
    .slice(-4)
    .filter((entry) => entry.region === region)
    .length;
};

const resolvePendingCauseTimeout = (state: GameState): GameState => {
  const pendingTargetId = state.flags.pending_cause_target;

  if (typeof pendingTargetId !== 'string' || !pendingTargetId) {
    return state;
  }

  const targetIndex = state.investigation.targets.findIndex((target) => target.id === pendingTargetId);
  if (targetIndex === -1) {
    return {
      ...state,
      flags: {
        ...state.flags,
        pending_cause_target: '',
        pending_cause_blocks: 0,
        pending_cause_deadline_ms: 0
      }
    };
  }

  const target = state.investigation.targets[targetIndex];
  if (target.eliminated || !target.knownName || !target.knownFace) {
    return {
      ...state,
      flags: {
        ...state.flags,
        pending_cause_target: '',
        pending_cause_blocks: 0,
        pending_cause_deadline_ms: 0
      }
    };
  }

  const intelCost = deathCauseIntelCost['heart-attack'];
  const willpowerCost = deathCauseWillpowerCost['heart-attack'];

  if (state.stats.intel < intelCost || state.stats.willpower < willpowerCost || state.inventory.notebookPages <= 0) {
    return pushLog(
      {
        ...state,
        flags: {
          ...state.flags,
          pending_cause_target: '',
          pending_cause_blocks: 0,
          pending_cause_deadline_ms: 0
        }
      },
      'system',
      '40-second timer expired, but resources were insufficient for default heart-attack execution.'
    );
  }

  const nextTargets = [...state.investigation.targets];
  nextTargets[targetIndex] = {
    ...target,
    eliminated: true
  };

  const fallbackTargetIndex = nextTargets.findIndex((entry) => !entry.eliminated);

  let next: GameState = {
    ...state,
    stats: {
      ...state.stats,
      intel: Math.max(0, state.stats.intel - intelCost),
      morality: clamp(state.stats.morality - deathCauseMoralityCost['heart-attack'], -100, 100),
      stress: clamp(state.stats.stress + deathCauseStressGain['heart-attack'], 0, 100),
      willpower: clamp(state.stats.willpower - willpowerCost, 0, 100)
    },
    inventory: {
      ...state.inventory,
      notebookPages: Math.max(0, state.inventory.notebookPages - 1)
    },
    investigation: {
      ...state.investigation,
      selectedCause: 'heart-attack',
      activeTargetIndex: fallbackTargetIndex === -1 ? targetIndex : fallbackTargetIndex,
      targets: nextTargets,
      eliminationLog: [
        ...state.investigation.eliminationLog,
        {
          targetId: target.id,
          alias: target.alias,
          trueName: target.trueName,
          region: target.region,
          cause: 'heart-attack',
          day: state.clock.day,
          block: state.clock.block
        }
      ]
    },
    flags: {
      ...state.flags,
      pending_cause_target: '',
      pending_cause_blocks: 0,
      pending_cause_deadline_ms: 0
    }
  };

  next = applySuspicionDelta(next, deathCauseSuspicionDelta['heart-attack'], 'execution_pattern_heart-attack');

  const regionalHits = getRecentRegionalEliminations(next, target.region);
  if (regionalHits >= 2) {
    next = applySuspicionDelta(next, regionalSpikePenalty, `regional_cluster_${target.region}`);
    next = pushLog(next, 'system', `Regional spike in ${target.region.toUpperCase()} raises L's suspicion.`);
  }

  next = pushLog(next, 'system', `40-second limit elapsed. ${target.trueName} defaults to Heart Attack.`);
  return next;
};

const applyPendingCauseCountdown = (state: GameState): GameState => {
  const pendingTargetId = state.flags.pending_cause_target;
  const pendingBlocks = state.flags.pending_cause_blocks;

  if (typeof pendingTargetId !== 'string' || !pendingTargetId) {
    return state;
  }

  if (typeof pendingBlocks !== 'number') {
    return state;
  }

  if (pendingBlocks > 0) {
    const decremented = pendingBlocks - 1;
    const decrementedState: GameState = {
      ...state,
      flags: {
        ...state.flags,
        pending_cause_blocks: decremented
      }
    };

    if (decremented > 0) {
      return decrementedState;
    }

    state = decrementedState;
  }

  return resolvePendingCauseTimeout(state);
};

const refreshInvestigationWave = (state: GameState): GameState => {
  if (state.investigation.targets.length === 0) {
    return state;
  }

  if (state.investigation.targets.some((target) => !target.eliminated)) {
    return state;
  }

  const currentWaveFlag = state.flags.investigation_wave;
  const currentWave = typeof currentWaveFlag === 'number' ? Math.max(1, Math.floor(currentWaveFlag)) : 1;
  const nextWave = currentWave + 1;

  return {
    ...state,
    flags: {
      ...state.flags,
      investigation_wave: nextWave
    },
    investigation: {
      ...state.investigation,
      activeTargetIndex: 0,
      targets: buildTargetWave(nextWave)
    }
  };
};

const advanceTimeStep = (state: GameState, blocks = 1): GameState => {
  const nextClock = advanceClock(state.clock, blocks);

  let next = {
    ...state,
    clock: nextClock,
    actionEconomy: {
      ...state.actionEconomy,
      actionsRemaining: state.actionEconomy.actionsPerBlock
    }
  };

  next = recalculateSuspicion(next);
  next = evaluateCanonTimeline(next);
  next = refreshInvestigationWave(next);
  next = applyPendingCauseCountdown(next);

  return next;
};

const spendAction = (state: GameState): GameState => {
  return {
    ...state,
    actionEconomy: {
      ...state.actionEconomy,
      actionsRemaining: state.actionEconomy.actionsRemaining - 1
    }
  };
};

const finalizeActionStep = (state: GameState): GameState => {
  if (state.phase === 'game-over' || state.actionEconomy.actionsRemaining > 0) {
    return state;
  }

  let next = advanceTimeStep(state, 1);

  if (next.flags.investigation_wave !== state.flags.investigation_wave) {
    next = pushLog(next, 'system', `New criminal dossier uploaded. Investigation wave ${next.flags.investigation_wave}.`);
  }

  next = applyProgression(next);
  next = pushLog(next, 'system', 'Time block ended. Moving to next block.');
  return next;
};

const autoTraverseLinearNodes = (state: GameState): GameState => {
  let next = state;
  let guard = 0;

  while (guard < 12) {
    guard += 1;

    const node = getCurrentNode(next);
    if (!node) {
      return next;
    }

    const hasChoices = (node.choices?.length ?? 0) > 0;
    if (hasChoices || !node.next) {
      return next;
    }

    next = visitNode(next, node.next, true);
  }

  return next;
};

const startNewGame = (mode: GameState['mode']): GameState => {
  let next = createInitialGameState(mode, 'playing');
  next = visitNode(next, next.narrative.currentNodeId, true);
  next = autoTraverseLinearNodes(next);
  next = evaluateCanonTimeline(next);
  next = applyProgression(next);
  next = pushLog(
    next,
    'system',
    mode === 'anime-canon'
      ? 'Canon puzzle mode initialized. Keep strict timeline integrity.'
      : 'Divergent mode initialized. Branch outcomes adapt to your profile.'
  );
  return next;
};

const applyProgression = (state: GameState): GameState => {
  const result = evaluateStoryProgression(state);
  if (result.message) {
    return pushLog(result.state, 'system', result.message);
  }

  return result.state;
};

export const gameReducer = (state: GameState, action: GameAction): GameState => {
  if (action.type !== 'START_NEW_GAME' && state.phase === 'game-over') {
    return state;
  }

  switch (action.type) {
    case 'START_NEW_GAME': {
      return startNewGame(action.mode);
    }

    case 'SET_PHASE': {
      return {
        ...state,
        phase: action.phase
      };
    }

    case 'ADVANCE_TIME': {
      const blocks = action.blocks ?? 1;
      let next = advanceTimeStep(state, blocks);

      if (next.flags.investigation_wave !== state.flags.investigation_wave) {
        next = pushLog(next, 'system', `New criminal dossier uploaded. Investigation wave ${next.flags.investigation_wave}.`);
      }

      next = applyProgression(next);
      next = pushLog(next, 'system', `Time advanced by ${blocks} block(s).`);
      return next;
    }

    case 'CONTINUE_NODE': {
      const node = getCurrentNode(state);
      if (!node || !node.next || (node.choices?.length ?? 0) > 0) {
        return pushLog(state, 'system', 'No auto-continue available on this node.');
      }

      let next = visitNode(state, node.next, true);
      next = autoTraverseLinearNodes(next);
      next = evaluateCanonTimeline(next);
      next = applyProgression(next);
      next = pushLog(next, 'story', 'Continued dialogue.');
      return next;
    }

    case 'PERFORM_ACTIVITY': {
      if (state.phase !== 'playing') {
        return state;
      }

      const activity = ACTIVITIES.find((entry) => entry.id === action.activityId);
      if (!activity) {
        return pushLog(state, 'system', `Unknown activity: ${action.activityId}`);
      }

      if (state.actionEconomy.actionsRemaining <= 0) {
        return pushLog(state, 'system', 'No actions left in this time block. Skip block to continue.');
      }

      if (!evaluateRequirements(activity.requirements, state)) {
        const unmet = listUnmetRequirements(activity.requirements, state);
        const message = unmet.length > 0 ? unmet.join(' | ') : 'requirements missing';
        return pushLog(state, 'system', `Cannot do ${activity.label}: ${message}.`);
      }

      let next: GameState = spendAction(state);

      next = applyEffects(next, activity.effects);
      next = evaluateCanonTimeline(next);
      next = applyProgression(next);
      next = pushLog(next, 'action', `Activity: ${activity.label}`);
      return finalizeActionStep(next);
    }

    case 'SELECT_INVESTIGATION_TARGET': {
      const maxIndex = state.investigation.targets.length - 1;
      if (maxIndex < 0) {
        return state;
      }

      const nextIndex = clamp(action.index, 0, maxIndex);
      if (nextIndex === state.investigation.activeTargetIndex) {
        return state;
      }

      const target = state.investigation.targets[nextIndex];
      const next = {
        ...state,
        investigation: {
          ...state.investigation,
          activeTargetIndex: nextIndex
        }
      };

      return pushLog(next, 'system', `Target focus shifted: ${target.alias}.`);
    }

    case 'SET_JUDGMENT_CAUSE': {
      if (state.investigation.selectedCause === action.cause) {
        return state;
      }

      if (state.flags.pending_cause_target) {
        return pushLog(state, 'system', 'Cause already locked for pending notebook countdown.');
      }

      const next = {
        ...state,
        investigation: {
          ...state.investigation,
          selectedCause: action.cause
        }
      };

      return pushLog(next, 'system', `Notebook cause set to ${deathCauseLabels[action.cause]}.`);
    }

    case 'PRIME_JUDGMENT_NAME': {
      if (state.phase !== 'playing') {
        return state;
      }

      const target = state.investigation.targets[state.investigation.activeTargetIndex];
      if (!target || target.eliminated) {
        return pushLog(state, 'system', 'No writable target selected.');
      }

      const normalizedInput = action.enteredName.trim().toLowerCase();
      const normalizedTargetName = target.trueName.trim().toLowerCase();

      if (normalizedInput !== normalizedTargetName) {
        return pushLog(state, 'system', 'Name mismatch. Death Note rejects the entry.');
      }

      if (!target.knownName || !target.knownFace) {
        return pushLog(state, 'system', 'Cannot prime notebook: true name and face intel are both required.');
      }

      const next = {
        ...state,
        flags: {
          ...state.flags,
          pending_cause_target: target.id,
          pending_cause_blocks: causeTimeoutBlocks,
          pending_cause_deadline_ms: action.deadlineMs
        }
      };

      return pushLog(next, 'system', 'Name entered. 40-second cause window started.');
    }

    case 'INVESTIGATE_TARGET_NAME': {
      if (state.phase !== 'playing') {
        return state;
      }

      if (state.actionEconomy.actionsRemaining <= 0) {
        return pushLog(state, 'system', 'No actions left in this time block. Skip block to continue.');
      }

      const targetIndex = state.investigation.activeTargetIndex;
      const target = state.investigation.targets[targetIndex];

      if (!target) {
        return pushLog(state, 'system', 'No investigation target selected.');
      }

      if (target.eliminated) {
        return pushLog(state, 'system', `${target.alias} is already neutralized.`);
      }

      if (target.knownName) {
        return pushLog(state, 'system', `True name already confirmed for ${target.alias}.`);
      }

      let next: GameState = spendAction(state);
      const nextTargets = [...next.investigation.targets];
      nextTargets[targetIndex] = {
        ...target,
        knownName: true
      };

      next = {
        ...next,
        stats: {
          ...next.stats,
          intel: Math.max(0, next.stats.intel + 1),
          stress: clamp(next.stats.stress + 2, 0, 100)
        },
        investigation: {
          ...next.investigation,
          targets: nextTargets
        }
      };

      next = applySuspicionDelta(next, 3, 'police_database_probe');
      next = pushLog(next, 'action', `Database trace complete: name acquired for ${target.alias}.`);
      return finalizeActionStep(next);
    }

    case 'INVESTIGATE_TARGET_FACE': {
      if (state.phase !== 'playing') {
        return state;
      }

      if (state.actionEconomy.actionsRemaining <= 0) {
        return pushLog(state, 'system', 'No actions left in this time block. Skip block to continue.');
      }

      const targetIndex = state.investigation.activeTargetIndex;
      const target = state.investigation.targets[targetIndex];

      if (!target) {
        return pushLog(state, 'system', 'No investigation target selected.');
      }

      if (target.eliminated) {
        return pushLog(state, 'system', `${target.alias} is already neutralized.`);
      }

      const sourceLabel = action.source === 'news-clip' ? 'news clip' : 'social feed';

      if (target.knownFace && target.faceSource === action.source) {
        return pushLog(state, 'system', `Face evidence from ${sourceLabel} already archived.`);
      }

      let next: GameState = spendAction(state);
      const nextTargets = [...next.investigation.targets];
      nextTargets[targetIndex] = {
        ...target,
        knownFace: true,
        faceSource: action.source
      };

      next = {
        ...next,
        stats: {
          ...next.stats,
          intel: Math.max(0, next.stats.intel + 1),
          stress: clamp(next.stats.stress + 1, 0, 100)
        },
        investigation: {
          ...next.investigation,
          targets: nextTargets
        }
      };

      next = applySuspicionDelta(next, action.source === 'news-clip' ? 1 : 2, 'face_intel_probe');
      next = pushLog(next, 'action', `Face intel captured from ${sourceLabel} for ${target.alias}.`);
      return finalizeActionStep(next);
    }

    case 'WRITE_JUDGMENT': {
      if (state.phase !== 'playing') {
        return state;
      }

      if (state.actionEconomy.actionsRemaining <= 0) {
        return pushLog(state, 'system', 'No actions left in this time block. Skip block to continue.');
      }

      if (state.inventory.notebookPages <= 0) {
        return pushLog(state, 'system', 'Notebook is out of pages.');
      }

      const targetIndex = state.investigation.activeTargetIndex;
      const target = state.investigation.targets[targetIndex];
      const cause = state.investigation.selectedCause;

      if (!target) {
        return pushLog(state, 'system', 'No investigation target selected.');
      }

      if (target.eliminated) {
        return pushLog(state, 'system', `${target.alias} is already neutralized.`);
      }

      if (!target.knownName || !target.knownFace) {
        const missing = [
          !target.knownName ? 'true name' : null,
          !target.knownFace ? 'face confirmation' : null
        ]
          .filter((value): value is string => Boolean(value))
          .join(' + ');

        return pushLog(state, 'system', `Judgment blocked: gather ${missing} first.`);
      }

      const intelCost = deathCauseIntelCost[cause];
      const willpowerCost = deathCauseWillpowerCost[cause];

      if (state.stats.intel < intelCost) {
        return pushLog(state, 'system', `Judgment blocked: need Intel ${intelCost}.`);
      }

      if (state.stats.willpower < willpowerCost) {
        return pushLog(state, 'system', `Judgment blocked: need Willpower ${willpowerCost}.`);
      }

      const nextTargets = [...state.investigation.targets];
      nextTargets[targetIndex] = {
        ...target,
        eliminated: true
      };

      const fallbackTargetIndex = nextTargets.findIndex((entry) => !entry.eliminated);

      let next: GameState = spendAction(state);
      next = {
        ...next,
        stats: {
          ...next.stats,
          intel: Math.max(0, next.stats.intel - intelCost),
          morality: clamp(next.stats.morality - deathCauseMoralityCost[cause], -100, 100),
          stress: clamp(next.stats.stress + deathCauseStressGain[cause], 0, 100),
          willpower: clamp(next.stats.willpower - willpowerCost, 0, 100)
        },
        inventory: {
          ...next.inventory,
          notebookPages: Math.max(0, next.inventory.notebookPages - 1)
        },
        investigation: {
          ...next.investigation,
          selectedCause: 'heart-attack',
          activeTargetIndex: fallbackTargetIndex === -1 ? targetIndex : fallbackTargetIndex,
          targets: nextTargets,
          eliminationLog: [
            ...next.investigation.eliminationLog,
            {
              targetId: target.id,
              alias: target.alias,
              trueName: target.trueName,
              region: target.region,
              cause,
              day: state.clock.day,
              block: state.clock.block
            }
          ]
        },
        flags: {
          ...next.flags,
          pending_cause_target: '',
          pending_cause_blocks: 0,
          pending_cause_deadline_ms: 0
        }
      };

      next = applySuspicionDelta(next, deathCauseSuspicionDelta[cause], `execution_pattern_${cause}`);

      const regionalHits = getRecentRegionalEliminations(next, target.region);
      if (regionalHits >= 2) {
        next = applySuspicionDelta(next, regionalSpikePenalty, `regional_cluster_${target.region}`);
        next = pushLog(next, 'system', `Regional spike in ${target.region.toUpperCase()} raises L's suspicion.`);
      }

      next = pushLog(next, 'action', `Judgment written: ${target.trueName} (${deathCauseLabels[cause]}).`);

      if (next.investigation.targets.every((entry) => entry.eliminated)) {
        next = pushLog(next, 'system', 'Current target slate exhausted. Advance time to wait for new leads.');
      }

      return finalizeActionStep(next);
    }

    case 'RESOLVE_PENDING_CAUSE_TIMEOUT': {
      const deadline = state.flags.pending_cause_deadline_ms;
      if (typeof deadline !== 'number' || deadline <= 0) {
        return state;
      }

      if (action.nowMs < deadline) {
        return state;
      }

      return resolvePendingCauseTimeout({
        ...state,
        flags: {
          ...state.flags,
          pending_cause_blocks: 0
        }
      });
    }

    case 'TOGGLE_SHINIGAMI_EYE': {
      const active = Boolean(state.flags.shinigami_eye_active);

      if (active) {
        return {
          ...state,
          flags: {
            ...state.flags,
            shinigami_eye_active: false
          }
        };
      }

      if (state.stats.willpower <= 1) {
        return pushLog(state, 'system', 'Shinigami Eyes failed: insufficient life force.');
      }

      const next: GameState = {
        ...state,
        stats: {
          ...state.stats,
          willpower: Math.max(0, Math.floor(state.stats.willpower / 2))
        },
        flags: {
          ...state.flags,
          shinigami_eye_active: true
        }
      };

      return pushLog(next, 'system', 'Shinigami Eyes activated. Half of your life force is consumed.');
    }

    case 'SELECT_CHOICE': {
      if (state.phase !== 'playing') {
        return state;
      }

      const node = getCurrentNode(state);
      if (!node) {
        return pushLog(state, 'system', 'No active dialogue node.');
      }

      const nodeChoices = node.choices ?? [];
      const choice = nodeChoices.find((entry) => entry.id === action.choiceId);

      if (!choice) {
        return pushLog(state, 'system', `Choice unavailable: ${action.choiceId}`);
      }

      const unmet = listUnmetRequirements(choice.requirements, state);
      if (unmet.length > 0) {
        return pushLog(state, 'system', `Choice locked: ${unmet.join(' | ')}.`);
      }

      let next: GameState = {
        ...state,
        narrative: {
          ...state.narrative,
          choiceHistory: [
            ...state.narrative.choiceHistory,
            {
              nodeId: node.id,
              choiceId: choice.id,
              day: state.clock.day,
              block: state.clock.block
            }
          ]
        }
      };

      if (choice.effects?.length) {
        next = applyEffects(next, choice.effects);
      }

      if (next.phase !== 'game-over') {
        next = visitNode(next, choice.next, true);
        next = autoTraverseLinearNodes(next);
        next = evaluateCanonTimeline(next);
        next = applyProgression(next);
      }

      next = pushLog(next, 'story', `Choice: ${choice.label}`);
      return next;
    }

    case 'APPLY_EFFECTS': {
      let next = applyEffects(state, action.effects);
      next = evaluateCanonTimeline(next);
      next = applyProgression(next);
      return next;
    }

    case 'SET_NODE': {
      let next = state;

      if (action.treeId && action.treeId !== state.narrative.activeTreeId) {
        const tree = getDialogueTree(action.treeId);
        if (!tree) {
          return pushLog(state, 'system', `Unknown tree: ${action.treeId}`);
        }

        next = {
          ...next,
          narrative: {
            ...next.narrative,
            activeTreeId: tree.meta.id,
            currentNodeId: tree.meta.startNodeId
          }
        };
      }

      next = visitNode(next, action.nodeId, action.addSeen ?? true);
      next = autoTraverseLinearNodes(next);
      next = applyProgression(next);
      return next;
    }

    case 'PUSH_LOG': {
      return pushLog(state, action.kind, action.text, action.day, action.block);
    }

    case 'TRIGGER_GAME_OVER': {
      return {
        ...state,
        phase: 'game-over',
        gameOver: {
          reason: action.reason,
          detail: action.detail,
          day: state.clock.day,
          block: state.clock.block
        }
      };
    }

    case 'UPDATE_MILESTONE': {
      return {
        ...state,
        canon: {
          ...state.canon,
          activeMilestoneId: action.setActive
            ? action.milestoneId
            : state.canon.activeMilestoneId,
          milestoneState: {
            ...state.canon.milestoneState,
            [action.milestoneId]: action.status
          }
        }
      };
    }

    default:
      return state;
  }
};
