import type { UserRouteSelectionInput } from "./exerciseRunner.ts";

export type DraftRouteSelectionState = {
  selectedExerciseId: string | null;
  draftSelectedNodeIds: readonly string[];
  draftSelectedRoadIds: readonly string[];
};

export type RunRouteExerciseDraftInput = {
  exerciseId: string;
  selection: UserRouteSelectionInput;
};

export function createDraftRouteSelectionState(): DraftRouteSelectionState {
  return {
    selectedExerciseId: null,
    draftSelectedNodeIds: [],
    draftSelectedRoadIds: []
  };
}

export function setDraftSelectedExercise(
  state: DraftRouteSelectionState,
  exerciseId: string
): DraftRouteSelectionState {
  if (state.selectedExerciseId === exerciseId) {
    return state;
  }

  return {
    selectedExerciseId: exerciseId,
    draftSelectedNodeIds: [],
    draftSelectedRoadIds: []
  };
}

export function clearDraftSelectedExercise(state: DraftRouteSelectionState): DraftRouteSelectionState {
  if (
    state.selectedExerciseId === null &&
    state.draftSelectedNodeIds.length === 0 &&
    state.draftSelectedRoadIds.length === 0
  ) {
    return state;
  }

  return createDraftRouteSelectionState();
}

export function addDraftSelectedNode(state: DraftRouteSelectionState, nodeId: string): DraftRouteSelectionState {
  return {
    ...state,
    draftSelectedNodeIds: [...state.draftSelectedNodeIds, nodeId]
  };
}

export function removeLastDraftSelectedNode(state: DraftRouteSelectionState): DraftRouteSelectionState {
  if (state.draftSelectedNodeIds.length === 0) {
    return state;
  }

  return {
    ...state,
    draftSelectedNodeIds: state.draftSelectedNodeIds.slice(0, -1)
  };
}

export function clearDraftSelectedNodes(state: DraftRouteSelectionState): DraftRouteSelectionState {
  if (state.draftSelectedNodeIds.length === 0) {
    return state;
  }

  return {
    ...state,
    draftSelectedNodeIds: []
  };
}

export function addDraftSelectedRoad(state: DraftRouteSelectionState, roadId: string): DraftRouteSelectionState {
  return {
    ...state,
    draftSelectedRoadIds: [...state.draftSelectedRoadIds, roadId]
  };
}

export function removeLastDraftSelectedRoad(state: DraftRouteSelectionState): DraftRouteSelectionState {
  if (state.draftSelectedRoadIds.length === 0) {
    return state;
  }

  return {
    ...state,
    draftSelectedRoadIds: state.draftSelectedRoadIds.slice(0, -1)
  };
}

export function clearDraftSelectedRoads(state: DraftRouteSelectionState): DraftRouteSelectionState {
  if (state.draftSelectedRoadIds.length === 0) {
    return state;
  }

  return {
    ...state,
    draftSelectedRoadIds: []
  };
}

export function clearDraftRouteSelection(state: DraftRouteSelectionState): DraftRouteSelectionState {
  if (state.draftSelectedNodeIds.length === 0 && state.draftSelectedRoadIds.length === 0) {
    return state;
  }

  return {
    ...state,
    draftSelectedNodeIds: [],
    draftSelectedRoadIds: []
  };
}

export function toUserRouteSelectionInput(state: DraftRouteSelectionState): UserRouteSelectionInput {
  return {
    nodeIds: [...state.draftSelectedNodeIds],
    roadIds: [...state.draftSelectedRoadIds]
  };
}

export function toRunRouteExerciseDraftInput(state: DraftRouteSelectionState): RunRouteExerciseDraftInput | null {
  if (!state.selectedExerciseId) {
    return null;
  }

  return {
    exerciseId: state.selectedExerciseId,
    selection: toUserRouteSelectionInput(state)
  };
}
