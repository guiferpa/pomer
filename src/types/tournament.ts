// As estruturas de blinds que o organizador escolhe no formulário.
export const STRUCTURE_NAMES = ["small", "medium", "large", "turbo"] as const;

export type StructureName = (typeof STRUCTURE_NAMES)[number];

export interface BlindLevel {
  level: number;
  smallBlind: number;
  bigBlind: number;
  duration: number; // em minutos
}

export interface TournamentConfig {
  name: string;
  levelDuration: number; // minutos
  breakInterval: number; // a cada quantos níveis
  breakDuration: number; // minutos
  // Estrutura escolhida no formulário. Os níveis em `blindStructure` valem para
  // o torneio; o nome serve para o formulário voltar como foi deixado. Falta em
  // configurações e torneios gravados por versões antigas.
  structure?: StructureName;
  blindStructure: BlindLevel[];
  primaryColor: string; // cor primária personalizada
}

export interface TournamentState {
  config: TournamentConfig;
  currentLevel: number;
  timeRemaining: number; // segundos
  isRunning: boolean;
  isBreak: boolean;
  history: LevelHistory[];
  startTime?: Date;
}

export interface LevelHistory {
  level: number;
  smallBlind: number;
  bigBlind: number;
  startTime: Date;
  endTime: Date;
  duration: number;
}

// Estrutura de blinds criada pelo organizador. O id é gerado no aparelho e não
// muda; `updatedAt` (ISO) é a data da última edição e define a ordem da lista.
export interface BlindStructure {
  id: string;
  name: string;
  levels: BlindLevel[];
  updatedAt: string;
}

// Um nível em edição: guarda o texto digitado, que só vira número ao salvar.
export interface LevelDraft {
  smallBlind: string;
  bigBlind: string;
  duration: string;
}

// Uma estrutura em edição. Sem `id`, é uma estrutura nova.
export interface StructureDraft {
  id?: string;
  name: string;
  levels: LevelDraft[];
}
