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

// O último nível vale até o reset: não há intervalo nem nível depois dele.
export const isLastLevel = ({
  config,
  currentLevel,
  isBreak,
}: TournamentState): boolean =>
  !isBreak && currentLevel === config.blindStructure.length;

// Derivado, sem campo próprio: o torneio segue rodando em 00:00, o que mantém
// a tela ligada e faz o refresh restaurar o mesmo estado.
export const isTimeUp = (state: TournamentState): boolean =>
  isLastLevel(state) && state.timeRemaining <= 0;

// Quantos níveis, contando o atual, faltam para o próximo intervalo, ou null
// quando nenhum outro vai acontecer. Vale para quem está em um nível, não em um
// intervalo.
export const levelsUntilNextBreak = ({
  config: { breakInterval, blindStructure },
  currentLevel,
}: TournamentState): number | null => {
  const breakAfter = Math.ceil(currentLevel / breakInterval) * breakInterval;

  return breakAfter < blindStructure.length
    ? breakAfter - currentLevel + 1
    : null;
};

// Único lugar que define o que vem depois do nível ou intervalo atual.
const enterNext = (state: TournamentState, at: Date): TournamentState => {
  const { config, currentLevel, isBreak } = state;
  const levelData = config.blindStructure[currentLevel - 1];

  if (!levelData || isLastLevel(state)) return state;

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

    // Intervalo que sobrou de um estado salvo antes da regra do último nível.
    if (!config.blindStructure[level - 1]) {
      return {
        ...state,
        isBreak: false,
        isRunning: true,
        timeRemaining: 0,
        pausedTimeRemaining: undefined,
        // O refresh recalcula o tempo a partir daqui e precisa chegar em zero.
        startTime: new Date(
          at.getTime() - minutesToSeconds(levelData.duration) * 1000,
        ),
      };
    }

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

// O tempo passou: acerta o relógio pela hora real e atravessa tudo o que acabou
// nesse meio-tempo, seja um segundo normal, um timer atrasado ou o app reaberto.
// O novo nível ou intervalo começa quando o anterior acabou, e não em `now`, para
// o tempo restante e o histórico ficarem certos. Várias transições contam como
// uma só, então quem chama toca um único alerta.
export const advanceByTime = (
  state: TournamentState,
  now: Date,
): TransitionResult => {
  const levelData = state.config.blindStructure[state.currentLevel - 1];

  if (!state.isRunning || !state.startTime || !levelData || isTimeUp(state)) {
    return { state, transitioned: false };
  }

  const durationMinutes = state.isBreak
    ? state.config.breakDuration
    : levelData.duration;

  // O relógio do aparelho voltou para trás: é como se nenhum tempo tivesse
  // passado. O início acompanha a nova hora, senão o relógio ficaria parado até a
  // hora do aparelho alcançar o início antigo.
  if (now < state.startTime) {
    return {
      state: {
        ...state,
        startTime: now,
        timeRemaining: minutesToSeconds(durationMinutes),
      },
      transitioned: false,
    };
  }

  const timeRemaining = calculateTimeRemaining(
    state.startTime,
    durationMinutes,
    now,
  );

  if (timeRemaining > 0) {
    return { state: { ...state, timeRemaining }, transitioned: false };
  }

  if (isLastLevel(state)) {
    return { state: { ...state, timeRemaining: 0 }, transitioned: true };
  }

  const end = new Date(
    state.startTime.getTime() + minutesToSeconds(durationMinutes) * 1000,
  );

  return {
    state: advanceByTime(enterNext(state, end), now).state,
    transitioned: true,
  };
};

// O organizador pulou o nível ou intervalo atual.
export const skipLevel = (
  state: TournamentState,
  now: Date,
): TransitionResult => {
  const next = enterNext(state, now);

  return { state: next, transitioned: next !== state };
};
