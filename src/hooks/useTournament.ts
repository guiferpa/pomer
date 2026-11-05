import type {
  TournamentState,
  TournamentConfig,
  BreakInfo,
} from "@/types/tournament";

import { useState, useEffect, useCallback } from "react";

import { minutesToSeconds } from "@/utils/helpers";
import {
  advanceByTime,
  isTimeUp,
  repairSavedState,
  skipLevel,
} from "@/utils/transitions";

// Função para carregar estado do localStorage
const loadTournamentState = (): TournamentState | null => {
  try {
    const saved = localStorage.getItem("pomer-tournament-state");

    if (saved) {
      const parsed = JSON.parse(saved);

      // Converter strings de data de volta para objetos Date
      if (parsed.startTime) {
        parsed.startTime = new Date(parsed.startTime);
      }
      // Converter datas do histórico
      if (parsed.history) {
        parsed.history = parsed.history.map((item: any) => ({
          ...item,
          startTime: new Date(item.startTime),
          endTime: new Date(item.endTime),
        }));
      }

      return parsed;
    }
  } catch (error) {
    console.error("Erro ao carregar estado do torneio:", error);
  }

  return null;
};

// Função para salvar estado no localStorage
const saveTournamentState = (state: TournamentState) => {
  try {
    localStorage.setItem("pomer-tournament-state", JSON.stringify(state));
  } catch (error) {
    console.error("Erro ao salvar estado do torneio:", error);
  }
};

export const useTournament = () => {
  const [state, setState] = useState<TournamentState>(() => {
    const loadedState = loadTournamentState();

    if (loadedState) {
      const now = new Date();
      const savedState = repairSavedState(loadedState, now);

      // Recalcular tempo restante baseado no tempo salvo
      const currentLevelData =
        savedState.config.blindStructure[savedState.currentLevel - 1];

      if (savedState.isRunning && savedState.startTime && currentLevelData) {
        const totalDuration = savedState.isBreak
          ? savedState.config.breakDuration * 60
          : currentLevelData.duration * 60;

        const elapsedSeconds = Math.floor(
          (now.getTime() - savedState.startTime.getTime()) / 1000,
        );
        const remaining = Math.max(0, totalDuration - elapsedSeconds);

        return {
          ...savedState,
          timeRemaining: remaining,
        };
      }

      return savedState;
    }

    // Estado padrão se não houver estado salvo
    return {
      config: {
        name: "Torneio Pomer",
        levelDuration: 20,
        breakInterval: 3,
        breakDuration: 10,
        blindStructure: [],
        primaryColor: "#006FEE",
      },
      currentLevel: 1,
      timeRemaining: 0,
      isRunning: false,
      isBreak: false,
      history: [],
    };
  });

  // Salvar estado no localStorage sempre que mudar
  useEffect(() => {
    saveTournamentState(state);
  }, [state]);

  // Timer effect
  useEffect(() => {
    let interval: NodeJS.Timeout;

    if (state.isRunning && state.startTime) {
      interval = setInterval(() => {
        const now = new Date();

        setState((prevState) => advanceByTime(prevState, now).state);
      }, 1000);
    }

    return () => {
      if (interval) {
        clearInterval(interval);
      }
    };
  }, [state.isRunning, state.startTime, state.isBreak, state.currentLevel]);

  // Iniciar torneio
  const startTournament = useCallback((config: TournamentConfig) => {
    const startTime = new Date();
    const firstLevel = config.blindStructure[0];

    setState({
      config,
      currentLevel: 1,
      timeRemaining: minutesToSeconds(
        firstLevel?.duration || config.levelDuration,
      ),
      isRunning: true,
      isBreak: false,
      history: [],
      startTime,
    });
  }, []);

  // Pausar/Retomar torneio
  const toggleTournament = useCallback(() => {
    setState((prevState) => {
      // Em 00:00 o torneio segue rodando, o que mantém a tela ligada.
      if (isTimeUp(prevState)) return prevState;

      if (prevState.isRunning) {
        // Pausando - salvar o tempo restante atual
        return {
          ...prevState,
          isRunning: false,
          pausedTimeRemaining: prevState.timeRemaining,
        };
      } else {
        // Retomando - recalcular o startTime baseado no tempo pausado
        const currentLevelData =
          prevState.config.blindStructure[prevState.currentLevel - 1];

        if (!currentLevelData) return prevState;

        const totalDuration = prevState.isBreak
          ? prevState.config.breakDuration * 60
          : currentLevelData.duration * 60;

        const newStartTime = new Date(
          Date.now() -
            (totalDuration - (prevState.pausedTimeRemaining || 0)) * 1000,
        );

        return {
          ...prevState,
          isRunning: true,
          startTime: newStartTime,
          pausedTimeRemaining: undefined,
        };
      }
    });
  }, []);

  // Pular para próximo nível
  const nextLevel = useCallback(() => {
    const now = new Date();

    setState((prevState) => skipLevel(prevState, now).state);
  }, []);

  // Reset torneio
  const resetTournament = useCallback(() => {
    // Limpar localStorage
    localStorage.removeItem("pomer-tournament-state");

    setState((prevState) => ({
      ...prevState,
      config: {
        ...prevState.config,
        blindStructure: [], // Limpar estrutura de blinds
      },
      currentLevel: 1,
      timeRemaining: 0,
      isRunning: false,
      isBreak: false,
      history: [],
      startTime: undefined,
    }));
  }, []);

  // Obter informações do break
  const getBreakInfo = useCallback((): BreakInfo => {
    // const needsBreak = shouldTakeBreak(state.currentLevel, state.config.breakInterval);
    // const levelsUntilBreak = state.config.breakInterval - (state.currentLevel % state.config.breakInterval);

    return {
      isBreak: state.isBreak,
      breakTimeRemaining: state.isBreak ? state.timeRemaining : 0,
      nextLevel: state.isBreak ? state.currentLevel + 1 : state.currentLevel,
    };
  }, [state]);

  return {
    state,
    startTournament,
    toggleTournament,
    nextLevel,
    resetTournament,
    getBreakInfo,
  };
};
