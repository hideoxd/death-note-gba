import { derived } from 'svelte/store';

import { ACTIVITIES, CANON_MILESTONES, SUSPICION_RULES } from '$lib/data';
import { evaluateRequirements, listUnmetRequirements } from '$lib/engine/conditions';
import { getAvailableChoices, getCurrentNode } from '$lib/engine/dialogue';
import { gameState } from '$lib/stores/gameState';

import type { GameState, TimeBlock } from '$lib/types/game';
import type { Requirement } from '$lib/types/narrative';

const blockOrder: TimeBlock[] = ['morning', 'afternoon', 'night'];

const blockIndex = (block: TimeBlock): number => blockOrder.indexOf(block);

const getBlocksUntil = (state: GameState, targetDay: number, targetBlock: TimeBlock): number => {
  const dayDelta = targetDay - state.clock.day;
  return dayDelta * blockOrder.length + (blockIndex(targetBlock) - blockIndex(state.clock.block));
};

const getActiveCanonMilestone = (state: GameState) => {
  if (state.mode !== 'anime-canon') {
    return null;
  }

  const activeId = state.canon.activeMilestoneId;
  if (!activeId) {
    return null;
  }

  return CANON_MILESTONES.find((entry) => entry.id === activeId) ?? null;
};

const latestWindowBlock = (windowBlocks: TimeBlock[]): TimeBlock => {
  if (windowBlocks.length === 0) {
    return 'night';
  }

  return windowBlocks.reduce((latest, block) =>
    blockIndex(block) > blockIndex(latest) ? block : latest
  );
};

const canonicalFlag = (state: GameState, key: string): boolean => Boolean(state.flags[key]);

const hasCompletedRayeIncident = (state: GameState): boolean => {
  return (
    canonicalFlag(state, 'raye_executed') || state.canon.milestoneState.RAYE_PENBER_INCIDENT === 'completed'
  );
};

const getCanonicalRecommendedChoiceId = (state: GameState): string | null => {
  if (state.mode !== 'anime-canon' || state.phase !== 'playing') {
    return null;
  }

  if (!canonicalFlag(state, 'first_execution_done')) {
    return 'follow_canon';
  }

  if (!canonicalFlag(state, 'joined_taskforce')) {
    return 'join_taskforce';
  }

   if (!canonicalFlag(state, 'surveillance_evaded')) {
    return 'potato_chip_plan';
  }

  if (!canonicalFlag(state, 'canon_episode_02_started')) {
    return null;
  }

  if (!canonicalFlag(state, 'raye_identified')) {
    return 'track_fbi_pattern';
  }

  if (!canonicalFlag(state, 'raye_controlled')) {
    return 'prepare_bus_script';
  }

  if (!hasCompletedRayeIncident(state)) {
    return state.clock.day >= 10 ? 'execute_raye' : 'maintain_cover';
  }

  if (!canonicalFlag(state, 'canon_episode_03_started')) {
    return null;
  }

  if (!canonicalFlag(state, 'misa_controlled')) {
    return 'use_misa_controlled';
  }

  if (!canonicalFlag(state, 'memory_plan_executed')) {
    return 'execute_memory_plan';
  }

  if (!canonicalFlag(state, 'higuchi_captured')) {
    return 'recover_memory_and_kill_higuchi';
  }

  if (!canonicalFlag(state, 'l_dead')) {
    return 'corner_rem';
  }

  if (!canonicalFlag(state, 'mikami_proxy_active')) {
    return 'deploy_mikami';
  }

  if (!canonicalFlag(state, 'takada_channel_established')) {
    return 'stabilize_takada_channel';
  }

  if (!canonicalFlag(state, 'mello_interference')) {
    return 'allow_mello_interference';
  }

  if (!canonicalFlag(state, 'yellow_box_triggered')) {
    return null;
  }

  return null;
};

const getDisplayUnmetRequirements = (
  requirements: Requirement[] | undefined,
  state: GameState
): string[] => {
  if (!requirements || requirements.length === 0) {
    return [];
  }

  const filteredRequirements = requirements.filter((requirement) => {
    if (requirement.type === 'flag.is' && requirement.value === false) {
      return false;
    }

    if (requirement.type === 'time.window') {
      return false;
    }

    return true;
  });

  return listUnmetRequirements(filteredRequirements, state);
};

export const phase = derived(gameState, ($state) => $state.phase);
export const mode = derived(gameState, ($state) => $state.mode);
export const clockLabel = derived(
  gameState,
  ($state) => `Day ${$state.clock.day} - ${$state.clock.block.toUpperCase()}`
);

export const suspicionPercent = derived(gameState, ($state) => Math.round($state.suspicion.meter));
export const suspicionTrend = derived(gameState, ($state) => $state.suspicion.trend);

export const isGameOver = derived(
  gameState,
  ($state) =>
    $state.phase === 'game-over' ||
    $state.suspicion.meter >= 100 ||
    ($state.mode === 'anime-canon' && $state.canon.fractured)
);

export const currentNode = derived(gameState, ($state) => getCurrentNode($state));
export const availableChoices = derived(gameState, ($state) => getAvailableChoices($state));
export const actionsRemaining = derived(gameState, ($state) => $state.actionEconomy.actionsRemaining);

export const choiceOptions = derived(gameState, ($state) => {
  const node = getCurrentNode($state);
  const choices = node?.choices ?? [];
  const recommendedCanonChoiceId = getCanonicalRecommendedChoiceId($state);

  return choices.map((choice) => {
    const canUseChoice = evaluateRequirements(choice.requirements, $state);
    const unmet = getDisplayUnmetRequirements(choice.requirements, $state);
    const canonicalRecommendation =
      $state.mode === 'anime-canon' && choice.id === recommendedCanonChoiceId;

    return {
      ...choice,
      disabled: !canUseChoice || $state.phase !== 'playing',
      unmet,
      isRecommended:
        unmet.length === 0 &&
        (canonicalRecommendation ||
          ($state.mode === 'divergent' && choice.id.includes('observe')))
    };
  });
});

export const activityOptions = derived(gameState, ($state) => {
  return ACTIVITIES.map((activity) => {
    const canUseActivity = evaluateRequirements(activity.requirements, $state);
    const unmet = getDisplayUnmetRequirements(activity.requirements, $state);

    return {
      ...activity,
      disabled:
        $state.phase !== 'playing' ||
        $state.actionEconomy.actionsRemaining <= 0 ||
        !canUseActivity,
      unmet
    };
  });
});

export const recentLog = derived(gameState, ($state) => $state.log.slice(-5).reverse());

export const activeMilestoneInfo = derived(gameState, ($state) => {
  const milestone = getActiveCanonMilestone($state);
  if (!milestone) {
    return null;
  }

  return {
    id: milestone.id,
    label: milestone.label,
    window: milestone.window,
    requiredFlags: milestone.requiredFlags,
    metFlags: milestone.requiredFlags.filter((flag) => Boolean($state.flags[flag]))
  };
});

export const canonDeadlineInfo = derived(gameState, ($state) => {
  const milestone = getActiveCanonMilestone($state);
  if (!milestone) {
    return null;
  }

  const requiredFlags = milestone.requiredFlags;
  const metFlags = requiredFlags.filter((flag) => Boolean($state.flags[flag]));
  const missingFlags = requiredFlags.filter((flag) => !Boolean($state.flags[flag]));
  const deadlineBlock = latestWindowBlock(milestone.window.blocks);
  const blocksUntilDeadline = getBlocksUntil($state, milestone.window.dayMax, deadlineBlock);

  const urgency =
    blocksUntilDeadline <= 2
      ? 'critical'
      : blocksUntilDeadline <= 6
        ? 'high'
        : blocksUntilDeadline <= 12
          ? 'medium'
          : 'stable';

  return {
    id: milestone.id,
    label: milestone.label,
    dayMin: milestone.window.dayMin,
    dayMax: milestone.window.dayMax,
    deadlineBlock,
    blocksUntilDeadline,
    urgency,
    metFlags,
    missingFlags
  };
});

export const gameplayHint = derived(gameState, ($state) => {
  if ($state.phase !== 'playing') {
    return 'Game is paused or ended.';
  }

  if ($state.actionEconomy.actionsRemaining <= 0) {
    return 'No actions left. Skip block to continue the day.';
  }

  if ($state.suspicion.meter >= SUSPICION_RULES.thresholds.captureRisk) {
    return 'Critical suspicion: prioritize alibi and social cover immediately.';
  }

  if ($state.suspicion.meter >= SUSPICION_RULES.thresholds.activeInvestigation) {
    return 'Investigation is intense. Alternate Intel with safe activities.';
  }

  const activeTarget = $state.investigation.targets[$state.investigation.activeTargetIndex];
  if (activeTarget && !activeTarget.eliminated) {
    if (typeof $state.flags.pending_cause_target === 'string' && $state.flags.pending_cause_target === activeTarget.id) {
      const blocksLeft =
        typeof $state.flags.pending_cause_blocks === 'number' ? Math.max(0, $state.flags.pending_cause_blocks) : 0;
      return `Cause countdown active: ${blocksLeft} block(s) until default heart attack.`;
    }

    if (!activeTarget.knownName) {
      return `Investigation: trace the true name for ${activeTarget.alias} from police data.`;
    }

    if (!activeTarget.knownFace) {
      return `Investigation: capture ${activeTarget.alias}'s face via news clip or social feed.`;
    }
  }

  if ($state.stats.willpower < 20) {
    return 'Willpower low: study or family cover to recharge notebook focus.';
  }

  if ($state.stats.intel < 2) {
    return 'Low Intel: gather more data before writing a judgment.';
  }

  if ($state.stats.alibi < 6) {
    return 'Low Alibi: study or socialize to keep your profile clean.';
  }

  if ($state.mode === 'anime-canon') {
    const milestone = getActiveCanonMilestone($state);
    if (milestone) {
      const pendingFlags = milestone.requiredFlags.filter((flag) => !Boolean($state.flags[flag]));

      if (pendingFlags.length > 0) {
        const deadline = latestWindowBlock(milestone.window.blocks);
        const blocksLeft = getBlocksUntil($state, milestone.window.dayMax, deadline);

        if (blocksLeft <= 2) {
          return `Canon emergency: complete ${pendingFlags.join(', ')} by Day ${milestone.window.dayMax} ${deadline.toUpperCase()}.`;
        }

        if (blocksLeft <= 6) {
          return `Canon deadline close: secure ${pendingFlags.join(', ')} before Day ${milestone.window.dayMax} ${deadline.toUpperCase()}.`;
        }
      }
    }

    if (!$state.flags.first_execution_done) {
      return 'Canon step: perform the first notebook execution.';
    }

    if (!$state.flags.joined_taskforce) {
      return 'Canon step: join the task force to stay near L.';
    }

    if (!$state.flags.surveillance_evaded) {
      return 'Canon step: win the surveillance war with the potato-chip deception plan.';
    }

    if (!$state.flags.canon_episode_02_started) {
      return 'Advance to Day 2 to unlock the Raye Penber arc.';
    }

    if (!$state.flags.raye_identified) {
      return 'Canon step: identify Raye Penber through FBI tracking.';
    }

    if (!$state.flags.raye_controlled) {
      return 'Canon step: run the bus-jacking control script to secure Raye.';
    }

    if (!hasCompletedRayeIncident($state)) {
      if ($state.clock.day < 10) {
        return 'Hold cover until Day 10, then execute the Raye incident.';
      }

      return 'Canon step: execute the Raye incident before the window closes.';
    }

    if (!$state.flags.canon_episode_03_started) {
      return 'Reach Day 8 to begin Misa, Yotsuba, and succession arcs.';
    }

    if (!$state.flags.misa_controlled) {
      return 'Canon step: keep Misa controlled before she destabilizes the investigation.';
    }

    if (!$state.flags.memory_plan_executed) {
      return 'Canon step: execute memory-loss plan to begin the Yotsuba handoff.';
    }

    if (!$state.flags.higuchi_captured) {
      return 'Canon step: recover notebook memories during Higuchi capture.';
    }

    if (!$state.flags.l_dead) {
      return 'Canon step: force Rem into L-death event.';
    }

    if (!$state.flags.mikami_proxy_active) {
      return 'Canon step: deploy Mikami as execution proxy.';
    }

    if (!$state.flags.takada_channel_established) {
      return 'Canon step: establish Takada as proxy communication channel.';
    }

    if (!$state.flags.mello_interference) {
      return 'Canon step: preserve the chain where Mello forces Mikami to deviate.';
    }

    if (!$state.flags.yellow_box_triggered) {
      return 'Canon step: trigger the Yellow Box confrontation.';
    }
  }

  return 'Balanced state. Push narrative choices or grind toward your objective.';
});

export const canContinueFromCurrentNode = derived(gameState, ($state) => {
  const node = getCurrentNode($state);
  if (!node || !node.next) return false;
  if (node.choices && node.choices.length > 0) return false;

  return $state.phase === 'playing';
});

export const pendingCauseCountdown = derived(gameState, ($state) => {
  const pendingTargetId = $state.flags.pending_cause_target;
  const blocksRemaining = $state.flags.pending_cause_blocks;

  if (typeof pendingTargetId !== 'string' || !pendingTargetId) {
    return null;
  }

  const target = $state.investigation.targets.find((entry) => entry.id === pendingTargetId);
  if (!target || target.eliminated) {
    return null;
  }

  return {
    targetId: pendingTargetId,
    alias: target.alias,
    region: target.region,
    blocksRemaining: typeof blocksRemaining === 'number' ? Math.max(0, blocksRemaining) : 0,
    willDefaultTo: 'heart-attack' as const
  };
});

export const patternData = derived(gameState, ($state) => {
  const entries = $state.investigation.eliminationLog;
  const byBlock: Record<TimeBlock, number> = {
    morning: 0,
    afternoon: 0,
    night: 0
  };

  const byRegion: Record<'kanto' | 'kansai' | 'tohoku' | 'kyushu', number> = {
    kanto: 0,
    kansai: 0,
    tohoku: 0,
    kyushu: 0
  };

  for (const entry of entries) {
    byBlock[entry.block] += 1;
    byRegion[entry.region] += 1;
  }

  return {
    total: entries.length,
    byBlock,
    byRegion,
    dominantBlock: (Object.entries(byBlock).sort((a, b) => b[1] - a[1])[0]?.[0] ?? 'morning') as TimeBlock,
    dominantRegion: (Object.entries(byRegion).sort((a, b) => b[1] - a[1])[0]?.[0] ?? 'kanto') as
      | 'kanto'
      | 'kansai'
      | 'tohoku'
      | 'kyushu'
  };
});

export const dualModeView = derived(gameState, ($state) => {
  return $state.flags.dual_mode === 'l' ? 'l' : 'kira';
});

export const unreachableCurrentNode = derived(gameState, ($state) => {
  const node = getCurrentNode($state);
  if (!node) return false;

  if (!node.requirements || node.requirements.length === 0) {
    return false;
  }

  return !evaluateRequirements(node.requirements, $state);
});

export const statusFlags = derived(gameState, ($state) => ({
  canonFractured: $state.canon.fractured,
  canonReason: $state.canon.failureReason,
  activeMilestoneId: $state.canon.activeMilestoneId,
  gameOverReason: $state.gameOver?.reason ?? null
}));
