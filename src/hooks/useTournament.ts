import type {
  TournamentState,
  TournamentConfig,
  BreakInfo,
} from "@/types/tournament";

import { useState, useEffect, useCallback, useRef } from "react";

import { useAudio } from "./useAudio";

import { minutesToSeconds } from "@/utils/helpers";
import {
  advanceByTime,
  isTimeUp,
  skipLevel,
  type TransitionResult,
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
  // Alerta devido e ainda não tocado. Vive só na memória, nunca no estado salvo,
  // para um refresh não repetir um alerta. Ao abrir o torneio depois de uma
  // ausência, basta ligar este valor no carregamento abaixo: o efeito do alerta
  // toca uma vez, mesmo com várias transições.
  const alertPending = useRef(false);

  const [state, setState] = useState<TournamentState>(() => {
    const savedState = loadTournamentState();

    if (savedState) {
      // Recalcular tempo restante baseado no tempo salvo
      const now = new Date();
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

  const { playSound } = useAudio();

  // Último estado, para calcular cada mudança uma única vez e fora das
  // atualizações do React, que podem rodar duas vezes. Toda mudança passa por
  // `update`, então este valor nunca fica atrás do estado.
  const latest = useRef(state);

  const update = useCallback(
    (change: (current: TournamentState) => TournamentState) => {
      latest.current = change(latest.current);
      setState(latest.current);
    },
    [],
  );

  const advance = useCallback(
    (step: (current: TournamentState, now: Date) => TransitionResult) => {
      const result = step(latest.current, new Date());

      if (result.transitioned) alertPending.current = true;
      update(() => result.state);
    },
    [update],
  );

  // Único lugar que toca o alerta. Toda transição gera um novo estado, e o valor
  // é desligado antes de tocar, então rodar o efeito de novo não repete o som.
  useEffect(() => {
    if (!alertPending.current) return;

    alertPending.current = false;
    playSound("level_change");
  }, [state]);

  // Salvar estado no localStorage sempre que mudar
  useEffect(() => {
    saveTournamentState(state);
  }, [state]);

  // Timer effect
  useEffect(() => {
    let interval: NodeJS.Timeout;

    if (state.isRunning && state.startTime) {
      interval = setInterval(() => advance(advanceByTime), 1000);
    }

    return () => {
      if (interval) {
        clearInterval(interval);
      }
    };
  }, [
    advance,
    state.isRunning,
    state.startTime,
    state.isBreak,
    state.currentLevel,
  ]);

  // Iniciar torneio
  const startTournament = useCallback(
    (config: TournamentConfig) => {
      const startTime = new Date();
      const firstLevel = config.blindStructure[0];

      update(() => ({
        config,
        currentLevel: 1,
        timeRemaining: minutesToSeconds(
          firstLevel?.duration || config.levelDuration,
        ),
        isRunning: true,
        isBreak: false,
        history: [],
        startTime,
      }));
    },
    [update],
  );

  // Pausar/Retomar torneio
  const toggleTournament = useCallback(() => {
    update((prevState) => {
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
  }, [update]);

  // Pular para próximo nível
  const nextLevel = useCallback(() => advance(skipLevel), [advance]);

  // Reset torneio
  const resetTournament = useCallback(() => {
    // Limpar localStorage
    localStorage.removeItem("pomer-tournament-state");

    update((prevState) => ({
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
  }, [update]);

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
