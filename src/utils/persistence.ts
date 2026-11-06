import type {
  LevelHistory,
  TournamentConfig,
  TournamentState,
} from "@/types/tournament";

import { repairSavedState } from "@/utils/transitions";

// Único lugar que lê e grava o torneio e a última configuração. O tema e o
// idioma ficam com quem cuida deles.
const TOURNAMENT_KEY = "pomer-tournament-state";
const CONFIG_KEY = "pomer-config";

export type LoadedTournament =
  | { status: "saved"; state: TournamentState }
  | { status: "empty" }
  | { status: "invalid" };

// O JSON guarda datas como texto.
const withDates = (parsed: any): TournamentState => ({
  ...parsed,
  ...(parsed.startTime ? { startTime: new Date(parsed.startTime) } : {}),
  history: (parsed.history ?? []).map((item: LevelHistory) => ({
    ...item,
    startTime: new Date(item.startTime),
    endTime: new Date(item.endTime),
  })),
});

const isObject = (value: unknown): value is Record<string, any> =>
  typeof value === "object" && value !== null && !Array.isArray(value);

const isNumber = (value: unknown): value is number =>
  typeof value === "number" && Number.isFinite(value);

const isUsableLevel = (level: unknown): boolean =>
  isObject(level) &&
  isNumber(level.smallBlind) &&
  isNumber(level.bigBlind) &&
  isNumber(level.duration);

const hasUsableLevels = (blindStructure: unknown): boolean =>
  Array.isArray(blindStructure) &&
  blindStructure.length > 0 &&
  blindStructure.every(isUsableLevel);

const isHistory = (history: unknown): boolean =>
  history === undefined ||
  (Array.isArray(history) && history.every(isObject));

const isTournament = (parsed: unknown): boolean =>
  isObject(parsed) &&
  isObject(parsed.config) &&
  hasUsableLevels(parsed.config.blindStructure) &&
  isNumber(parsed.currentLevel) &&
  isNumber(parsed.timeRemaining) &&
  isHistory(parsed.history);

// Resets antigos gravavam um estado em branco em vez de esvaziar a chave.
const isBlank = (parsed: unknown): boolean =>
  isObject(parsed) &&
  isObject(parsed.config) &&
  Array.isArray(parsed.config.blindStructure) &&
  parsed.config.blindStructure.length === 0;

const parse = (raw: string): unknown => {
  try {
    return JSON.parse(raw);
  } catch {
    return undefined;
  }
};

// Lê o torneio salvo, já corrigido do que versões antigas deixaram. Não muda o
// que está salvo: quem chama decide gravar ou esvaziar a chave.
export const loadTournament = (now: Date): LoadedTournament => {
  const raw = localStorage.getItem(TOURNAMENT_KEY);

  if (raw === null) return { status: "empty" };

  const parsed = parse(raw);

  if (isBlank(parsed)) return { status: "empty" };
  if (!isTournament(parsed)) return { status: "invalid" };

  return { status: "saved", state: repairSavedState(withDates(parsed), now) };
};

// Sem estrutura de blinds não há torneio, como depois de um reset: a chave fica
// vazia, e o próximo carregamento abre o formulário.
export const saveTournament = (state: TournamentState): void => {
  if (state.config.blindStructure.length === 0) {
    localStorage.removeItem(TOURNAMENT_KEY);
  } else {
    localStorage.setItem(TOURNAMENT_KEY, JSON.stringify(state));
  }
};

const isConfig = (parsed: unknown): parsed is TournamentConfig =>
  isObject(parsed) &&
  typeof parsed.name === "string" &&
  isNumber(parsed.levelDuration) &&
  isNumber(parsed.breakInterval) &&
  isNumber(parsed.breakDuration) &&
  typeof parsed.primaryColor === "string" &&
  hasUsableLevels(parsed.blindStructure);

// A última configuração usada, para preencher o formulário. Inválida, é ignorada
// e o formulário usa os valores padrão.
export const loadConfig = (): TournamentConfig | null => {
  const raw = localStorage.getItem(CONFIG_KEY);
  const parsed = raw === null ? null : parse(raw);

  return isConfig(parsed) ? parsed : null;
};

export const saveConfig = (config: TournamentConfig): void => {
  localStorage.setItem(CONFIG_KEY, JSON.stringify(config));
};
