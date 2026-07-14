export const LEARNER_TRAINING_HINT_AUTO_DISMISS_MS = 30_000;

export type LearnerTrainingHintPresentationState = {
  hintKey: string | null;
  isOpen: boolean;
  remainingMs: number;
  keptOpen: boolean;
  pausedByUser: boolean;
};

export function createLearnerTrainingHintPresentationState(): LearnerTrainingHintPresentationState {
  return {
    hintKey: null,
    isOpen: false,
    remainingMs: LEARNER_TRAINING_HINT_AUTO_DISMISS_MS,
    keptOpen: false,
    pausedByUser: false
  };
}

export function presentLearnerTrainingHint(
  state: LearnerTrainingHintPresentationState,
  hintKey: string
): LearnerTrainingHintPresentationState {
  if (state.hintKey === hintKey) {
    return { ...state, isOpen: true };
  }

  return {
    hintKey,
    isOpen: true,
    remainingMs: LEARNER_TRAINING_HINT_AUTO_DISMISS_MS,
    keptOpen: false,
    pausedByUser: false
  };
}

export function dismissLearnerTrainingHint(
  state: LearnerTrainingHintPresentationState
): LearnerTrainingHintPresentationState {
  return { ...state, isOpen: false, pausedByUser: false };
}

export function reopenLearnerTrainingHint(
  state: LearnerTrainingHintPresentationState
): LearnerTrainingHintPresentationState {
  return {
    ...state,
    isOpen: state.hintKey !== null,
    keptOpen: state.remainingMs === 0 ? true : state.keptOpen,
    pausedByUser: false
  };
}

export function keepLearnerTrainingHintOpen(
  state: LearnerTrainingHintPresentationState
): LearnerTrainingHintPresentationState {
  return { ...state, isOpen: true, keptOpen: true, pausedByUser: false };
}

export function toggleLearnerTrainingHintTimer(
  state: LearnerTrainingHintPresentationState
): LearnerTrainingHintPresentationState {
  if (!state.isOpen || state.keptOpen) {
    return state;
  }

  return { ...state, pausedByUser: !state.pausedByUser };
}

export function advanceLearnerTrainingHintTimer(
  state: LearnerTrainingHintPresentationState,
  elapsedMs: number
): LearnerTrainingHintPresentationState {
  if (!state.isOpen || state.keptOpen || state.pausedByUser || elapsedMs <= 0) {
    return state;
  }

  const remainingMs = Math.max(0, state.remainingMs - elapsedMs);

  return {
    ...state,
    isOpen: remainingMs > 0,
    remainingMs
  };
}
