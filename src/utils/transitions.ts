import type { TournamentState } from "@/types/tournament";

import {
  calculateTimeRemaining,
  getNextLevel,
  minutesToSeconds,
  shouldTakeBreak,
} from "@/utils/helpers";

export interface TransitionResult {
  state: TournamentState;
  // Atualizações de estado do React podem rodar duas vezes, então quem chama
  // decide o efeito colateral (o alerta) a partir deste campo, fora delas.
  transitioned: boolean;
}

// Único lugar que define o que vem depois do nível ou intervalo atual.
const enterNext = (state: TournamentState, at: Date): TournamentState => {
  const { config, currentLevel, isBreak } = state;
  const levelData = config.blindStructure[currentLevel - 1];

  if (!levelData) return state;

  const enter = (
    changes: Pick<TournamentState, "currentLevel" | "isBreak" | "history">,
    durationMinutes: number,
  ): TournamentState => {
    const timeRemaining = minutesToSeconds(durationMinutes);

    return {
      ...state,
      ...changes,
      startTime: at,
      timeRemaining,
      // Pausado, o tempo cheio precisa valer ao retomar.
      ...(state.isRunning ? {} : { pausedTimeRemaining: timeRemaining }),
    };
  };

  if (isBreak) {
    const level = currentLevel + 1;

    return enter(
      { currentLevel: level, isBreak: false, history: state.history },
      config.blindStructure[level - 1]?.duration || config.levelDuration,
    );
  }

  const history = [
    ...state.history,
    {
      level: currentLevel,
      smallBlind: levelData.smallBlind,
      bigBlind: levelData.bigBlind,
      startTime: state.startTime ?? at,
      endTime: at,
      duration: levelData.duration,
    },
  ];

  if (shouldTakeBreak(currentLevel, config.breakInterval)) {
    return enter(
      { currentLevel, isBreak: true, history },
      config.breakDuration,
    );
  }

  const level = getNextLevel(currentLevel, config.blindStructure.length);

  return enter(
    { currentLevel: level, isBreak: false, history },
    config.blindStructure[level - 1]?.duration || config.levelDuration,
  );
};

// O tempo passou: conta o relógio e, se ele acabou, entra no que vem depois.
export const advanceByTime = (
  state: TournamentState,
  now: Date,
): TransitionResult => {
  const levelData = state.config.blindStructure[state.currentLevel - 1];

  if (!state.isRunning || !state.startTime || !levelData) {
    return { state, transitioned: false };
  }

  const timeRemaining = calculateTimeRemaining(
    state.startTime,
    state.isBreak ? state.config.breakDuration : levelData.duration,
    now,
  );

  if (timeRemaining <= 0) {
    return { state: enterNext(state, now), transitioned: true };
  }

  return { state: { ...state, timeRemaining }, transitioned: false };
};

// O organizador pulou o nível ou intervalo atual.
export const skipLevel = (
  state: TournamentState,
  now: Date,
): TransitionResult => {
  const next = enterNext(state, now);

  return { state: next, transitioned: next !== state };
};
