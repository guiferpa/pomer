export interface BlindLevel {
  level: number;
  smallBlind: number;
  bigBlind: number;
  // Ausente quando o nível não tem ante.
  ante?: number;
  duration: number; // em minutos
}

export interface TournamentConfig {
  name: string;
  breakInterval: number; // a cada quantos níveis
  breakDuration: number; // minutos
  // Id da estrutura escolhida no formulário, para ele voltar como foi deixado.
  // Os níveis que valem para o torneio são a cópia em `blindStructure`. Falta em
  // configurações e torneios gravados por versões antigas.
  structureId?: string;
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
  // Ausente quando o nível jogado não tinha ante.
  ante?: number;
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
  // Vazio quando o nível não tem ante.
  ante: string;
  duration: string;
}

// Uma estrutura em edição. Sem `id`, é uma estrutura nova.
export interface StructureDraft {
  id?: string;
  name: string;
  levels: LevelDraft[];
}
