import { generateBlindLevels } from "@/utils/helpers";

// Estruturas pré-definidas
export const defaultStructures = {
  // Torneio pequeno (buy-in baixo)
  small: generateBlindLevels(25, 15, 20),

  // Torneio médio (buy-in médio)
  medium: generateBlindLevels(50, 20, 20),

  // Torneio grande (buy-in alto)
  large: generateBlindLevels(100, 25, 20),

  // Torneio rápido (progressão mais agressiva)
  turbo: generateBlindLevels(25, 12, 10),
};

// Configuração padrão
export const defaultConfig = {
  name: "Torneio Pomer",
  levelDuration: 20, // 20 minutos
  breakInterval: 3, // a cada 3 níveis
  breakDuration: 10, // 10 minutos de break
  blindStructure: defaultStructures.medium,
  primaryColor: "#006FEE", // azul padrão do HeroUI
};
