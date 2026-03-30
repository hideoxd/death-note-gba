import type { GameState } from '$lib/types/game';
import type { Effect } from '$lib/types/narrative';
import { clamp } from '$lib/utils/clamp';
import { advanceClock } from '$lib/engine/time';
import { applySuspicionDelta, recalculateSuspicion } from '$lib/engine/suspicion';
import { markMilestoneCompleted } from '$lib/engine/canon';

const ensureRelationship = (state: GameState, characterId: string): GameState => {
  if (state.relationships[characterId]) {
    return state;
  }

  return {
    ...state,
    relationships: {
      ...state.relationships,
      [characterId]: {
        trust: 0,
        suspicion: 0,
        affinity: 0
      }
    }
  };
};

const applyStatDelta = (state: GameState, path: Effect['type'] extends never ? never : string, value: number) => {
  if (path === 'stats.alibi') {
    return {
      ...state,
      stats: {
        ...state.stats,
        alibi: Math.max(0, state.stats.alibi + value)
      }
    };
  }

  if (path === 'stats.intel') {
    return {
      ...state,
      stats: {
        ...state.stats,
        intel: Math.max(0, state.stats.intel + value)
      }
    };
  }

  if (path === 'stats.morality') {
    return {
      ...state,
      stats: {
        ...state.stats,
        morality: clamp(state.stats.morality + value, -100, 100)
      }
    };
  }

  if (path === 'stats.stress') {
    return {
      ...state,
      stats: {
        ...state.stats,
        stress: clamp(state.stats.stress + value, 0, 100)
      }
    };
  }

  return state;
};

export const applyEffects = (baseState: GameState, effects: Effect[]): GameState => {
  let state = baseState;

  for (const effect of effects) {
    switch (effect.type) {
      case 'stat.add': {
        state = applyStatDelta(state, effect.path, effect.value);
        break;
      }

      case 'stat.set': {
        if (effect.path === 'stats.alibi') {
          state = {
            ...state,
            stats: {
              ...state.stats,
              alibi: Math.max(0, effect.value)
            }
          };
        } else if (effect.path === 'stats.intel') {
          state = {
            ...state,
            stats: {
              ...state.stats,
              intel: Math.max(0, effect.value)
            }
          };
        } else if (effect.path === 'stats.morality') {
          state = {
            ...state,
            stats: {
              ...state.stats,
              morality: clamp(effect.value, -100, 100)
            }
          };
        } else if (effect.path === 'stats.stress') {
          state = {
            ...state,
            stats: {
              ...state.stats,
              stress: clamp(effect.value, 0, 100)
            }
          };
        }

        break;
      }

      case 'suspicion.add': {
        state = applySuspicionDelta(state, effect.value, effect.reason);
        break;
      }

      case 'flag.set': {
        state = {
          ...state,
          flags: {
            ...state.flags,
            [effect.key]: effect.value
          }
        };
        break;
      }

      case 'relationship.add': {
        state = ensureRelationship(state, effect.characterId);
        const relation = state.relationships[effect.characterId];

        if (effect.metric === 'trust') {
          state = {
            ...state,
            relationships: {
              ...state.relationships,
              [effect.characterId]: {
                ...relation,
                trust: clamp(relation.trust + effect.value, -100, 100)
              }
            }
          };
        } else if (effect.metric === 'suspicion') {
          state = {
            ...state,
            relationships: {
              ...state.relationships,
              [effect.characterId]: {
                ...relation,
                suspicion: clamp(relation.suspicion + effect.value, 0, 100)
              }
            }
          };
        } else {
          state = {
            ...state,
            relationships: {
              ...state.relationships,
              [effect.characterId]: {
                ...relation,
                affinity: clamp(relation.affinity + effect.value, -100, 100)
              }
            }
          };
        }

        break;
      }

      case 'time.advance': {
        state = {
          ...state,
          clock: advanceClock(state.clock, effect.blocks),
          actionEconomy: {
            ...state.actionEconomy,
            actionsRemaining: state.actionEconomy.actionsPerBlock
          }
        };
        state = recalculateSuspicion(state);
        break;
      }

      case 'milestone.complete': {
        state = markMilestoneCompleted(state, effect.milestoneId);
        break;
      }

      case 'node.jump': {
        state = {
          ...state,
          narrative: {
            ...state.narrative,
            currentNodeId: effect.nodeId,
            seenNodeIds: state.narrative.seenNodeIds.includes(effect.nodeId)
              ? state.narrative.seenNodeIds
              : [...state.narrative.seenNodeIds, effect.nodeId]
          }
        };
        break;
      }

      case 'gameover.trigger': {
        state = {
          ...state,
          phase: 'game-over',
          gameOver: {
            reason: effect.reason,
            detail: effect.detail,
            day: state.clock.day,
            block: state.clock.block
          }
        };

        if (effect.reason === 'canon-failure') {
          state = {
            ...state,
            canon: {
              ...state.canon,
              fractured: true,
              failureReason: effect.detail ?? 'Canon milestone failed.'
            }
          };
        }
        break;
      }

      default:
        break;
    }
  }

  return state;
};
