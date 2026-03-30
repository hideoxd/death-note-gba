import { DIALOGUE_TREES } from '$lib/data';
import { evaluateRequirements } from '$lib/engine/conditions';
import { applyEffects } from '$lib/engine/effects';
import type { DialogueChoice, DialogueNode, DialogueTree } from '$lib/types/narrative';
import type { GameState } from '$lib/types/game';

export const getDialogueTree = (treeId: string): DialogueTree | undefined => {
  return DIALOGUE_TREES[treeId];
};

export const getActiveDialogueTree = (state: GameState): DialogueTree | undefined => {
  return getDialogueTree(state.narrative.activeTreeId);
};

export const getCurrentNode = (state: GameState): DialogueNode | null => {
  const tree = getActiveDialogueTree(state);
  if (!tree) return null;
  return tree.nodes[state.narrative.currentNodeId] ?? null;
};

export const getAvailableChoices = (state: GameState): DialogueChoice[] => {
  const node = getCurrentNode(state);
  if (!node?.choices?.length) {
    return [];
  }

  return node.choices.filter((choice) => evaluateRequirements(choice.requirements, state));
};

export const visitNode = (state: GameState, nodeId: string, addSeen = true): GameState => {
  const tree = getActiveDialogueTree(state);
  const node = tree?.nodes[nodeId];

  if (!tree || !node) {
    return state;
  }

  const seenBefore = state.narrative.seenNodeIds.includes(nodeId);

  let nextState: GameState = {
    ...state,
    narrative: {
      ...state.narrative,
      currentNodeId: nodeId,
      seenNodeIds:
        addSeen && !seenBefore ? [...state.narrative.seenNodeIds, nodeId] : state.narrative.seenNodeIds
    }
  };

  if (!seenBefore && node.onEnter?.length) {
    nextState = applyEffects(nextState, node.onEnter);
  }

  return nextState;
};
