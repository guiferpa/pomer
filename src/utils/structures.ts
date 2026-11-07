import {
  STRUCTURE_NAMES,
  type BlindLevel,
  type StructureName,
} from "@/types/tournament";

const STRUCTURES: Record<
  StructureName,
  { firstBlind: number; levels: number; duration: number }
> = {
  // Torneio pequeno (buy-in baixo)
  small: { firstBlind: 25, levels: 15, duration: 20 },
  // Torneio médio (buy-in médio)
  medium: { firstBlind: 50, levels: 20, duration: 20 },
  // Torneio grande (buy-in alto)
  large: { firstBlind: 100, levels: 25, duration: 20 },
  // Torneio rápido: níveis mais curtos
  turbo: { firstBlind: 25, levels: 12, duration: 10 },
};

export const DEFAULT_STRUCTURE: StructureName = "medium";

export const isStructureName = (value: unknown): value is StructureName =>
  STRUCTURE_NAMES.includes(value as StructureName);

// Múltiplo do blind inicial em cada nível: 1, 2, 3 e, a partir do 4, alterna
// subidas de 1,5x e de 4/3x (4, 6, 8, 12, 16, 24...). Nenhum salto passa de 2x.
const multiplier = (level: number): number => {
  if (level <= 4) return level;

  const step = level - 4;

  return 4 * 2 ** Math.floor(step / 2) * (step % 2 === 1 ? 1.5 : 1);
};

export const blindLevels = (
  firstBlind: number,
  levels: number,
  duration: number,
): BlindLevel[] =>
  Array.from({ length: levels }, (_, i) => {
    const smallBlind = firstBlind * multiplier(i + 1);

    return { level: i + 1, smallBlind, bigBlind: smallBlind * 2, duration };
  });

// A duração que a estrutura sugere ao ser escolhida.
export const structureDuration = (name: StructureName): number =>
  STRUCTURES[name].duration;

// Os níveis da estrutura, com a duração que o organizador decidiu.
export const buildStructure = (
  name: StructureName,
  duration: number,
): BlindLevel[] => {
  const { firstBlind, levels } = STRUCTURES[name];

  return blindLevels(firstBlind, levels, duration);
};

// Configurações antigas não guardavam o nome: ele sai da quantidade de níveis e
// do primeiro blind. Sem correspondência, vale a estrutura padrão.
export const deduceStructure = (levels: BlindLevel[]): StructureName =>
  STRUCTURE_NAMES.find(
    (name) =>
      STRUCTURES[name].levels === levels.length &&
      STRUCTURES[name].firstBlind === levels[0]?.smallBlind,
  ) ?? DEFAULT_STRUCTURE;

// --- Estruturas criadas pelo organizador ---

export const LEVEL_FIELDS = ["smallBlind", "bigBlind", "duration"] as const;

export type LevelField = (typeof LEVEL_FIELDS)[number];

export const DURATION_LIMITS = { min: 1, max: 60 } as const;

export type LevelError =
  | "required"
  | "notPositiveInteger"
  | "bigBelowSmall"
  | "durationOutOfRange";

export type LevelErrors = Partial<Record<LevelField, LevelError>>;

const isPositiveInteger = (value: number) =>
  Number.isInteger(value) && value > 0;

// Os problemas de um nível já em números. A ordem crescente dos blinds entre
// níveis não é exigida.
export const levelErrors = (level: {
  smallBlind: number;
  bigBlind: number;
  duration: number;
}): LevelErrors => {
  const errors: LevelErrors = {};

  if (!isPositiveInteger(level.smallBlind)) {
    errors.smallBlind = "notPositiveInteger";
  }
  if (!isPositiveInteger(level.bigBlind)) {
    errors.bigBlind = "notPositiveInteger";
  } else if (!errors.smallBlind && level.bigBlind < level.smallBlind) {
    errors.bigBlind = "bigBelowSmall";
  }
  if (
    !Number.isInteger(level.duration) ||
    level.duration < DURATION_LIMITS.min ||
    level.duration > DURATION_LIMITS.max
  ) {
    errors.duration = "durationOutOfRange";
  }

  return errors;
};
