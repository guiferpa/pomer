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

// Escurece uma cor hexadecimal (#RRGGBB) pela fração indicada
export const darkenColor = (color: string, amount: number = 0.3): string => {
  const hex = color.replace("#", "");
  const r = parseInt(hex.slice(0, 2), 16);
  const g = parseInt(hex.slice(2, 4), 16);
  const b = parseInt(hex.slice(4, 6), 16);

  const newR = Math.floor(r * (1 - amount));
  const newG = Math.floor(g * (1 - amount));
  const newB = Math.floor(b * (1 - amount));

  return `#${newR.toString(16).padStart(2, "0")}${newG.toString(16).padStart(2, "0")}${newB.toString(16).padStart(2, "0")}`;
};
