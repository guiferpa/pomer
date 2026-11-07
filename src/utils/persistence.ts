import type {
  BlindLevel,
  BlindStructure,
  LevelHistory,
  TournamentConfig,
  TournamentState,
} from "@/types/tournament";

import { repairSavedState } from "@/utils/transitions";
import { levelErrors } from "@/utils/structures";

// Único lugar que lê e grava o torneio, a última configuração e as estruturas
// de blinds. O tema e o idioma ficam com quem cuida deles.
const TOURNAMENT_KEY = "pomer-tournament-state";
const CONFIG_KEY = "pomer-config";
const STRUCTURES_KEY = "pomer-structures";

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

// O ante é opcional: níveis gravados antes dele continuam valendo.
const isUsableLevel = (level: unknown): boolean =>
  isObject(level) &&
  isNumber(level.smallBlind) &&
  isNumber(level.bigBlind) &&
  (level.ante === undefined || isNumber(level.ante)) &&
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

// Configurações da versão anterior também guardavam a duração dos níveis e o
// nome de uma estrutura pronta: elas continuam válidas, e esses campos são
// ignorados.
const isConfig = (parsed: unknown): parsed is Record<string, any> =>
  isObject(parsed) &&
  typeof parsed.name === "string" &&
  isNumber(parsed.breakInterval) &&
  isNumber(parsed.breakDuration) &&
  typeof parsed.primaryColor === "string" &&
  hasUsableLevels(parsed.blindStructure);

// A última configuração usada, para preencher o formulário. Inválida, é
// ignorada e o formulário usa os valores padrão. A estrutura escolhida só volta
// se ainda estiver salva.
export const loadConfig = (): TournamentConfig | null => {
  const raw = localStorage.getItem(CONFIG_KEY);
  const parsed = raw === null ? null : parse(raw);

  if (!isConfig(parsed)) return null;

  const { name, breakInterval, breakDuration, primaryColor, blindStructure } =
    parsed;
  const config: TournamentConfig = {
    name,
    breakInterval,
    breakDuration,
    primaryColor,
    blindStructure,
  };
  const chosen = loadStructures().some((s) => s.id === parsed.structureId);

  return chosen ? { ...config, structureId: parsed.structureId } : config;
};

export const saveConfig = (config: TournamentConfig): void => {
  localStorage.setItem(CONFIG_KEY, JSON.stringify(config));
};

const isStoredLevel = (level: unknown): boolean =>
  isUsableLevel(level) &&
  Object.keys(levelErrors(level as BlindLevel)).length === 0;

const isStructure = (parsed: unknown): parsed is BlindStructure =>
  isObject(parsed) &&
  typeof parsed.id === "string" &&
  parsed.id !== "" &&
  typeof parsed.name === "string" &&
  parsed.name.trim() !== "" &&
  typeof parsed.updatedAt === "string" &&
  !Number.isNaN(Date.parse(parsed.updatedAt)) &&
  Array.isArray(parsed.levels) &&
  parsed.levels.length > 0 &&
  parsed.levels.every(isStoredLevel);

const byMostRecent = (a: BlindStructure, b: BlindStructure) =>
  Date.parse(b.updatedAt) - Date.parse(a.updatedAt);

// As estruturas salvas, da editada mais recentemente para a mais antiga. Cada
// estrutura inválida é ignorada sem aviso, e as demais seguem valendo.
export const loadStructures = (): BlindStructure[] => {
  const raw = localStorage.getItem(STRUCTURES_KEY);
  const parsed = raw === null ? null : parse(raw);

  if (!Array.isArray(parsed)) return [];

  return parsed.filter(isStructure).sort(byMostRecent);
};

// Grava uma estrutura nova ou substitui a de mesmo id. Quem chama decide o id e
// a data da edição.
export const saveStructure = (structure: BlindStructure): void => {
  const others = loadStructures().filter((s) => s.id !== structure.id);

  localStorage.setItem(
    STRUCTURES_KEY,
    JSON.stringify([structure, ...others].sort(byMostRecent)),
  );
};

// Apaga a estrutura de mesmo id. Um torneio em andamento guarda a própria cópia
// dos níveis, e a última configuração que a escolheu volta sem estrutura.
export const deleteStructure = (id: string): void => {
  localStorage.setItem(
    STRUCTURES_KEY,
    JSON.stringify(loadStructures().filter((s) => s.id !== id)),
  );
};
