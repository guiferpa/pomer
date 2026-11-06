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
  now: Date,
): number => {
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
  return currentLevel > 0 && currentLevel % breakInterval === 0;
};

// Formata valor monetário (para blinds)
export const formatCurrency = (value: number): string => {
  if (value >= 1000) {
    return `${(value / 1000).toFixed(1)}k`;
  }

  return value.toString();
};
