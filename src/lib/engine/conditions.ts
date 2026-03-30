import type { GameState } from '$lib/types/game';
import type { Requirement, RequirementOperator } from '$lib/types/narrative';

const resolvePathValue = (target: unknown, path: string): unknown => {
  return path.split('.').reduce<unknown>((acc, key) => {
    if (acc === null || acc === undefined) return undefined;
    if (typeof acc !== 'object') return undefined;
    return (acc as Record<string, unknown>)[key];
  }, target);
};

const compareValues = (
  left: unknown,
  operator: RequirementOperator,
  right: unknown
): boolean => {
  if (operator === '=') return left === right;
  if (operator === '!=') return left !== right;

  const leftNum = Number(left);
  const rightNum = Number(right);

  if (Number.isNaN(leftNum) || Number.isNaN(rightNum)) return false;

  switch (operator) {
    case '>':
      return leftNum > rightNum;
    case '>=':
      return leftNum >= rightNum;
    case '<':
      return leftNum < rightNum;
    case '<=':
      return leftNum <= rightNum;
    default:
      return false;
  }
};

export const evaluateRequirement = (requirement: Requirement, state: GameState): boolean => {
  switch (requirement.type) {
    case 'compare': {
      const value = resolvePathValue(state, requirement.path);
      return compareValues(value, requirement.op, requirement.value);
    }

    case 'flag.is': {
      return state.flags[requirement.key] === requirement.value;
    }

    case 'mode.is': {
      return state.mode === requirement.value;
    }

    case 'time.window': {
      const isAfterStart = requirement.dayMin ? state.clock.day >= requirement.dayMin : true;
      const isBeforeEnd = requirement.dayMax ? state.clock.day <= requirement.dayMax : true;
      const inBlockWindow = requirement.blocks
        ? requirement.blocks.includes(state.clock.block)
        : true;

      return isAfterStart && isBeforeEnd && inBlockWindow;
    }

    case 'milestone.state': {
      return state.canon.milestoneState[requirement.milestoneId] === requirement.state;
    }

    case 'relationship.compare': {
      const relationship = state.relationships[requirement.characterId] ?? {
        trust: 0,
        suspicion: 0,
        affinity: 0
      };

      return compareValues(relationship[requirement.metric], requirement.op, requirement.value);
    }

    default:
      return false;
  }
};

export const evaluateRequirements = (
  requirements: Requirement[] | undefined,
  state: GameState
): boolean => {
  if (!requirements || requirements.length === 0) {
    return true;
  }

  return requirements.every((requirement) => evaluateRequirement(requirement, state));
};

const formatValue = (value: unknown): string => {
  if (typeof value === 'boolean') return value ? 'true' : 'false';
  if (typeof value === 'number') return `${value}`;
  if (typeof value === 'string') return value;
  return 'required';
};

export const describeRequirement = (requirement: Requirement): string => {
  switch (requirement.type) {
    case 'compare':
      return `${requirement.path} ${requirement.op} ${formatValue(requirement.value)}`;
    case 'flag.is':
      return `${requirement.key} must be ${formatValue(requirement.value)}`;
    case 'mode.is':
      return `mode must be ${requirement.value}`;
    case 'time.window': {
      const dayPart =
        requirement.dayMin || requirement.dayMax
          ? `day ${requirement.dayMin ?? '?'}-${requirement.dayMax ?? '?'}`
          : 'any day';
      const blockPart = requirement.blocks?.length ? requirement.blocks.join('/') : 'any block';
      return `${dayPart}, ${blockPart}`;
    }
    case 'milestone.state':
      return `${requirement.milestoneId} must be ${requirement.state}`;
    case 'relationship.compare':
      return `${requirement.characterId}.${requirement.metric} ${requirement.op} ${requirement.value}`;
    default:
      return 'requirement not met';
  }
};

export const listUnmetRequirements = (
  requirements: Requirement[] | undefined,
  state: GameState
): string[] => {
  if (!requirements || requirements.length === 0) {
    return [];
  }

  return requirements
    .filter((requirement) => !evaluateRequirement(requirement, state))
    .map((requirement) => describeRequirement(requirement));
};
