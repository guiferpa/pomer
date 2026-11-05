import type { TournamentConfig, TournamentState } from "@/types/tournament";

import {
  calculateTimeRemaining,
  minutesToSeconds,
  shouldTakeBreak,
} from "@/utils/helpers";

// Folga para o arredondamento dos segundos não parecer um relógio que voltou.
const ROUNDING_TOLERANCE_SECONDS = 1;

export interface TransitionResult {
  state: TournamentState;
  // Atualizações de estado do React podem rodar duas vezes, então quem chama
  // decide o efeito colateral (o alerta) a partir deste campo, fora delas.
  transitioned: boolean;
}

// Duração de um nível, em minutos, com o padrão da configuração como reserva.
export const levelDurationMinutes = (
  config: TournamentConfig,
  level: number,
): number => config.blindStructure[level - 1]?.duration || config.levelDuration;

// Duração do nível ou intervalo atual, em minutos. Vale para um nível que existe
// na estrutura.
export const currentDurationMinutes = ({
  config,
  currentLevel,
  isBreak,
}: TournamentState): number =>
  isBreak
    ? config.breakDuration
    : config.blindStructure[currentLevel - 1].duration;

// O início que faz a contagem marcar `remainingSeconds` em `now`.
export const startTimeFor = (
  now: Date,
  durationMinutes: number,
  remainingSeconds: number,
): Date =>
  new Date(
    now.getTime() -
      (minutesToSeconds(durationMinutes) - remainingSeconds) * 1000,
  );

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

  // Fora do último nível, sempre existe um nível depois do atual.
  const level = currentLevel + 1;

  if (isBreak) {
    return enter(
      { currentLevel: level, isBreak: false, history: state.history },
      levelDurationMinutes(config, level),
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

  return enter(
    { currentLevel: level, isBreak: false, history },
    levelDurationMinutes(config, level),
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

  const durationMinutes = currentDurationMinutes(state);
  const timeRemaining = calculateTimeRemaining(
    state.startTime,
    durationMinutes,
    now,
  );

  // Rodando, o tempo restante só diminui. Se a conta deu mais do que o salvo, o
  // relógio do aparelho voltou para trás: é como se nenhum tempo tivesse passado.
  // O início acompanha a nova hora, para a contagem seguir a partir do salvo.
  if (timeRemaining > state.timeRemaining + ROUNDING_TOLERANCE_SECONDS) {
    return {
      state: {
        ...state,
        startTime: startTimeFor(now, durationMinutes, state.timeRemaining),
      },
      transitioned: false,
    };
  }

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

// Uma entrada por nível, a primeira, e nenhuma do último nível, que nunca termina.
const repairHistory = ({
  config,
  history,
}: TournamentState): TournamentState["history"] => {
  const seen = new Set([config.blindStructure.length]);
  const repaired = history.filter(({ level }) => {
    if (seen.has(level)) return false;
    seen.add(level);

    return true;
  });

  return repaired.length === history.length ? history : repaired;
};

// Pausado, vale o tempo que o organizador vê na tela. Sem estrutura de blinds não
// há torneio para retomar.
const repairPausedTime = (state: TournamentState): TournamentState =>
  state.isRunning ||
  state.config.blindStructure.length === 0 ||
  state.pausedTimeRemaining === state.timeRemaining
    ? state
    : { ...state, pausedTimeRemaining: state.timeRemaining };

// Corrige, uma vez ao carregar, o que versões antigas deixaram no estado salvo.
// Sem esses problemas, devolve o próprio estado recebido, e corrigir de novo um
// estado já corrigido não muda nada.
export const repairSavedState = (
  state: TournamentState,
  now: Date,
): TournamentState => {
  const { blindStructure } = state.config;
  const history = repairHistory(state);

  if (state.isBreak && state.currentLevel === blindStructure.length) {
    return {
      ...state,
      history,
      isBreak: false,
      // Em 00:00 o torneio segue rodando, mesmo que o intervalo estivesse pausado.
      isRunning: true,
      timeRemaining: 0,
      pausedTimeRemaining: undefined,
      // O refresh recalcula o tempo a partir daqui e precisa chegar em zero.
      startTime: startTimeFor(
        now,
        blindStructure[state.currentLevel - 1].duration,
        0,
      ),
    };
  }

  return repairPausedTime(
    history === state.history ? state : { ...state, history },
  );
};
