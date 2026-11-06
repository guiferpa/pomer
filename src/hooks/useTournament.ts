import type { TournamentState, TournamentConfig } from "@/types/tournament";

import { useState, useEffect, useCallback, useRef } from "react";

import { useAudio } from "./useAudio";

import { minutesToSeconds } from "@/utils/helpers";
import {
  advanceByTime,
  levelDurationMinutes,
  skipLevel,
  togglePause,
  type TransitionResult,
} from "@/utils/transitions";
import { loadTournament, saveTournament } from "@/utils/persistence";

export const useTournament = () => {
  // Alerta devido e ainda não tocado. Vive só na memória, nunca no estado salvo,
  // para um refresh não repetir um alerta. Várias transições de uma vez ligam este
  // valor uma só vez, e o efeito do alerta toca um único som.
  const alertPending = useRef(false);

  // Lido uma vez só. Um torneio inválido abre como se nada estivesse salvo, e a
  // primeira gravação esvazia a chave, então o refresh seguinte não avisa de novo.
  const [loaded] = useState(() => {
    const now = new Date();

    return { now, result: loadTournament(now) };
  });

  const [state, setState] = useState<TournamentState>(() => {
    const { now, result } = loaded;

    if (result.status === "saved") {
      // O torneio abre no ponto em que estaria pela hora real.
      const { state: current, transitioned } = advanceByTime(result.state, now);

      if (transitioned) alertPending.current = true;

      return current;
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
  // `changeState`, então este valor nunca fica atrás do estado.
  const latestState = useRef(state);

  const changeState = useCallback(
    (change: (current: TournamentState) => TournamentState) => {
      latestState.current = change(latestState.current);
      setState(latestState.current);
    },
    [],
  );

  const runTransition = useCallback(
    (step: (current: TournamentState, now: Date) => TransitionResult) => {
      const result = step(latestState.current, new Date());

      if (result.transitioned) alertPending.current = true;
      changeState(() => result.state);
    },
    [changeState],
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
    saveTournament(state);
  }, [state]);

  // Timer effect
  useEffect(() => {
    let interval: NodeJS.Timeout;

    if (state.isRunning && state.startTime) {
      interval = setInterval(() => runTransition(advanceByTime), 1000);
    }

    return () => {
      if (interval) {
        clearInterval(interval);
      }
    };
  }, [
    runTransition,
    state.isRunning,
    state.startTime,
    state.isBreak,
    state.currentLevel,
  ]);

  // Iniciar torneio
  const startTournament = useCallback(
    (config: TournamentConfig) => {
      const startTime = new Date();

      changeState(() => ({
        config,
        currentLevel: 1,
        timeRemaining: minutesToSeconds(levelDurationMinutes(config, 1)),
        isRunning: true,
        isBreak: false,
        history: [],
        startTime,
      }));
    },
    [changeState],
  );

  // Pausar/Retomar torneio
  const toggleTournament = useCallback(
    () => changeState((current) => togglePause(current, new Date())),
    [changeState],
  );

  // Pular para próximo nível
  const nextLevel = useCallback(() => runTransition(skipLevel), [runTransition]);

  // Reset torneio
  // Sem estrutura de blinds, a gravação esvazia a chave do torneio.
  const resetTournament = useCallback(() => {
    changeState((prevState) => ({
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
  }, [changeState]);

  return {
    state,
    startTournament,
    toggleTournament,
    nextLevel,
    resetTournament,
    savedTournamentLost: loaded.result.status === "invalid",
  };
};
