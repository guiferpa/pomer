import type { StructureName } from "@/utils/structures";

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
  pausedTimeRemaining?: number; // segundos - tempo restante quando pausado
}

export interface LevelHistory {
  level: number;
  smallBlind: number;
  bigBlind: number;
  startTime: Date;
  endTime: Date;
  duration: number;
}

export interface BreakInfo {
  isBreak: boolean;
  breakTimeRemaining: number; // segundos
  nextLevel: number;
}
