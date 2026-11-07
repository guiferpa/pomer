import type {
  BlindLevel,
  BlindStructure,
  LevelDraft,
  StructureDraft,
} from "@/types/tournament";

// Na ordem do editor: no celular, os blinds em cima, ante e duração embaixo.
export const LEVEL_FIELDS = [
  "smallBlind",
  "bigBlind",
  "ante",
  "duration",
] as const;

// O ante é o único campo do nível que pode ficar vazio.
const OPTIONAL_FIELDS: readonly LevelField[] = ["ante"];

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
// níveis não é exigida, e o ante, quando há, não depende dos blinds.
export const levelErrors = (level: {
  smallBlind: number;
  bigBlind: number;
  ante?: unknown;
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
    level.ante !== undefined &&
    !(typeof level.ante === "number" && isPositiveInteger(level.ante))
  ) {
    errors.ante = "notPositiveInteger";
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

export const emptyLevel = (): LevelDraft => ({
  smallBlind: "",
  bigBlind: "",
  ante: "",
  duration: "",
});

// Uma estrutura nova começa do zero: sem nome e com o 1º nível vazio.
export const emptyStructureDraft = (): StructureDraft => ({
  name: "",
  levels: [emptyLevel()],
});

// Uma estrutura salva aberta para edição, com o mesmo id. O ante fica vazio no
// nível que não tem.
export const structureToDraft = (structure: BlindStructure): StructureDraft => ({
  id: structure.id,
  name: structure.name,
  levels: structure.levels.map((level) => ({
    smallBlind: String(level.smallBlind),
    bigBlind: String(level.bigBlind),
    ante: level.ante === undefined ? "" : String(level.ante),
    duration: String(level.duration),
  })),
});

// O texto de um inteiro positivo, ou nada.
const positiveText = (text: string, times: number): string => {
  const value = Number(text.trim());

  return text.trim() !== "" && isPositiveInteger(value)
    ? String(value * times)
    : "";
};

// O nível sugerido depois de `previous`: o dobro dos blinds e do ante e a mesma
// duração. O que não for um inteiro positivo no nível anterior fica vazio, e
// sem ante no anterior o novo também vem sem.
export const suggestNextLevel = (previous: LevelDraft): LevelDraft => ({
  smallBlind: positiveText(previous.smallBlind, 2),
  bigBlind: positiveText(previous.bigBlind, 2),
  ante: positiveText(previous.ante, 2),
  duration: positiveText(previous.duration, 1),
});

export type NameError = "required" | "duplicate";

export interface StructureErrors {
  name?: NameError;
  // Na mesma posição dos níveis do rascunho.
  levels: LevelErrors[];
}

export type ValidatedStructure =
  | { ok: true; name: string; levels: BlindLevel[] }
  | { ok: false; errors: StructureErrors };

const sameName = (a: string, b: string) =>
  a.trim().toLocaleLowerCase() === b.trim().toLocaleLowerCase();

// Valida o rascunho. O nome não pode repetir o de outra estrutura salva; a
// própria estrutura, ao ser editada, não conta.
export const validateStructure = (
  draft: StructureDraft,
  saved: BlindStructure[],
): ValidatedStructure => {
  const name = draft.name.trim();
  const errors: StructureErrors = { levels: [] };

  if (name === "") {
    errors.name = "required";
  } else if (saved.some((s) => s.id !== draft.id && sameName(s.name, name))) {
    errors.name = "duplicate";
  }

  const levels = draft.levels.map((level, i) => {
    const ante = level.ante.trim();
    const numbers: Omit<BlindLevel, "level"> = {
      smallBlind: Number(level.smallBlind.trim()),
      bigBlind: Number(level.bigBlind.trim()),
      ...(ante === "" ? {} : { ante: Number(ante) }),
      duration: Number(level.duration.trim()),
    };
    const found = levelErrors(numbers);

    for (const field of LEVEL_FIELDS) {
      if (!OPTIONAL_FIELDS.includes(field) && level[field].trim() === "") {
        found[field] = "required";
      }
    }
    errors.levels.push(found);

    return { level: i + 1, ...numbers };
  });

  const valid =
    !errors.name &&
    levels.length > 0 &&
    errors.levels.every((found) => Object.keys(found).length === 0);

  return valid ? { ok: true, name, levels } : { ok: false, errors };
};

// Um identificador estável, gerado no aparelho. `randomUUID` só existe em
// contexto seguro; fora dele, vale uma combinação de data e acaso.
export const newStructureId = (): string =>
  typeof crypto !== "undefined" && typeof crypto.randomUUID === "function"
    ? crypto.randomUUID()
    : `${Date.now().toString(36)}-${Math.random().toString(36).slice(2)}`;
