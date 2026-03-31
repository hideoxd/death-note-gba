import { derived } from 'svelte/store';

import { gameState } from '$lib/stores/gameState';

type TimelineTone = 'neutral' | 'urgent' | 'danger' | 'critical';

export interface TimelineEntry {
  id: string;
  headline: string;
  detail: string;
  tone: TimelineTone;
}

const formatCause = (cause: string): string => {
  if (cause === 'heart-attack') return 'heart attack';
  if (cause === 'accident') return 'traffic accident';
  if (cause === 'poisoning') return 'suspected poisoning';
  if (cause === 'suicide') return 'apparent suicide';
  return 'sudden death';
};

export const worldTimeline = derived(gameState, ($state): TimelineEntry[] => {
  const entries: TimelineEntry[] = [];

  const eliminationLog = $state.investigation.eliminationLog;
  const latestElimination = eliminationLog.length > 0 ? eliminationLog[eliminationLog.length - 1] : undefined;
  if (latestElimination) {
    entries.push({
      id: 'timeline-elimination',
      headline: 'NPA Breaking',
      detail: `${latestElimination.alias} found dead by ${formatCause(latestElimination.cause)}.`,
      tone: latestElimination.cause === 'heart-attack' ? 'urgent' : 'danger'
    });
  } else {
    entries.push({
      id: 'timeline-elimination',
      headline: 'NPA Wire',
      detail: 'No Kira-pattern deaths reported in the last cycle.',
      tone: 'neutral'
    });
  }

  const unresolvedTargets = $state.investigation.targets.filter((target) => !target.eliminated).length;
  entries.push({
    id: 'timeline-targets',
    headline: 'Investigation Desk',
    detail: `${unresolvedTargets} active target${unresolvedTargets === 1 ? '' : 's'} remain under review.`,
    tone: unresolvedTargets <= 1 ? 'urgent' : 'neutral'
  });

  if (latestElimination) {
    const regionalStreak = eliminationLog
      .slice(-4)
      .filter((entry) => entry.region === latestElimination.region)
      .length;

    if (regionalStreak >= 2) {
    entries.push({
      id: 'timeline-region-alert',
      headline: `${latestElimination.region.toUpperCase()} Alert`,
      detail: 'Clustered deaths in one region trigger focused geo-profiling by L.',
      tone: 'critical'
    });
  }

  if (
    typeof $state.flags.pending_cause_target === 'string' &&
    $state.flags.pending_cause_target &&
    typeof $state.flags.pending_cause_blocks === 'number'
  ) {
    entries.push({
      id: 'timeline-cause-window',
      headline: 'Death Note Rule III',
      detail: `Cause override window active: ${Math.max(0, $state.flags.pending_cause_blocks)} block(s) before default heart attack.`,
      tone: 'urgent'
    });
  }

  if ($state.flags.shinigami_eye_active === true) {
    entries.push({
      id: 'timeline-eye-active',
      headline: 'Shinigami Eye',
      detail: 'Forbidden perception active. Identities are visible at severe life cost.',
      tone: 'danger'
    });
  }
  }

  entries.push({
    id: 'timeline-suspicion',
    headline: 'L Monitor',
    detail:
      $state.suspicion.meter >= 85
        ? 'L has concentrated surveillance around Kira behavior anomalies.'
        : $state.suspicion.meter >= 60
          ? 'Task force watchlist pressure is increasing across digital channels.'
          : 'Background watch remains stable. Keep a plausible daily routine.',
    tone: $state.suspicion.meter >= 85 ? 'critical' : $state.suspicion.meter >= 60 ? 'danger' : 'neutral'
  });

  const day = $state.clock.day;
  entries.push({
    id: `timeline-day-${day}`,
    headline: `Day ${day} Feed`,
    detail:
      day <= 2
        ? 'Public chatter is fragmented; Kira identity debates dominate late-night forums.'
        : day <= 5
          ? 'Anchors discuss pattern analysis while leak accounts speculate on target criteria.'
          : 'Civil anxiety rises as Kira discourse splits between fear, worship, and retaliation.',
    tone: day >= 7 ? 'urgent' : 'neutral'
  });

  return entries;
});
