import type { BlindLevel } from "@/types/tournament";

// As estruturas de blinds que o organizador escolhe no formulário.
export const STRUCTURE_NAMES = ["small", "medium", "large", "turbo"] as const;

export type StructureName = (typeof STRUCTURE_NAMES)[number];

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
