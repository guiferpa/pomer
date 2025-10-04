import type { BlindLevel } from "@/types/tournament";

// Converte segundos para formato MM:SS
export const formatTime = (seconds: number): string => {
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;

  return `${minutes.toString().padStart(2, "0")}:${remainingSeconds.toString().padStart(2, "0")}`;
};

// Converte minutos para segundos
export const minutesToSeconds = (minutes: number): number => {
  return minutes * 60;
};

// Calcula o tempo restante baseado no tempo de início
export const calculateTimeRemaining = (
  startTime: Date,
  durationMinutes: number,
): number => {
  const now = new Date();
  const elapsedSeconds = Math.floor(
    (now.getTime() - startTime.getTime()) / 1000,
  );
  const totalSeconds = minutesToSeconds(durationMinutes);
  const remaining = totalSeconds - elapsedSeconds;

  return Math.max(0, remaining);
};

// Verifica se é hora de um break
export const shouldTakeBreak = (
  currentLevel: number,
  breakInterval: number,
): boolean => {
  console.log(currentLevel, breakInterval, currentLevel % breakInterval);

  return currentLevel > 0 && currentLevel % breakInterval === 0;
};

// Calcula o próximo nível
export const getNextLevel = (
  currentLevel: number,
  totalLevels: number,
): number => {
  return Math.min(currentLevel + 1, totalLevels);
};

// Formata valor monetário (para blinds)
export const formatCurrency = (value: number): string => {
  if (value >= 1000) {
    return `${(value / 1000).toFixed(1)}k`;
  }

  return value.toString();
};

// Função para gerar estrutura de blinds com progressão controlada
export const generateBlindLevels = (
  startSmallBlind: number,
  levels: number = 20,
  duration: number = 20,
): BlindLevel[] => {
  const structure: BlindLevel[] = [];

  // Progressão mais controlada baseada em incrementos específicos
  const getSmallBlind = (level: number, start: number): number => {
    switch (level) {
      case 1:
        return start;
      case 2:
        return start * 2;
      case 3:
        return start * 3;
      case 4:
        return start * 4;
      case 5:
        return start * 6;
      case 6:
        return start * 8;
      case 7:
        return start * 12;
      case 8:
        return start * 16;
      case 9:
        return start * 24;
      case 10:
        return start * 32;
      case 11:
        return start * 48;
      case 12:
        return start * 64;
      case 13:
        return start * 96;
      case 14:
        return start * 128;
      case 15:
        return start * 192;
      case 16:
        return start * 256;
      case 17:
        return start * 384;
      case 18:
        return start * 512;
      case 19:
        return start * 768;
      case 20:
        return start * 1024;
      default:
        // Para níveis além de 20, usar progressão mais agressiva
        return Math.round(start * Math.pow(1.5, level - 1));
    }
  };

  for (let i = 0; i < levels; i++) {
    const smallBlind = getSmallBlind(i + 1, startSmallBlind);
    const bigBlind = smallBlind * 2;

    structure.push({
      level: i + 1,
      smallBlind,
      bigBlind,
      duration: duration,
    });
  }

  return structure;
};
