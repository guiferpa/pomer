import type {
  TournamentState,
  TournamentConfig,
  BreakInfo,
} from "@/types/tournament";

import { useState, useEffect, useCallback } from "react";

import {
  calculateTimeRemaining,
  shouldTakeBreak,
  getNextLevel,
} from "@/utils/helpers";

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

  // Salvar estado no localStorage sempre que mudar
  useEffect(() => {
    saveTournamentState(state);
  }, [state]);

  // Timer effect
  useEffect(() => {
    let interval: NodeJS.Timeout;

    if (state.isRunning && state.startTime) {
      interval = setInterval(() => {
        setState((prevState) => {
          if (!prevState.startTime) return prevState;

          const currentLevelData =
            prevState.config.blindStructure[prevState.currentLevel - 1];

          if (!currentLevelData) return prevState;

          const timeRemaining = calculateTimeRemaining(
            prevState.startTime,
            prevState.isBreak
              ? prevState.config.breakDuration
              : currentLevelData.duration,
          );

          // Se o tempo acabou
          if (timeRemaining <= 0) {
            if (prevState.isBreak) {
              // Break terminou, voltar ao próximo nível
              return {
                ...prevState,
                isBreak: false,
                currentLevel: prevState.currentLevel + 1,
                startTime: new Date(),
                timeRemaining: calculateTimeRemaining(
                  new Date(),
                  prevState.config.blindStructure[prevState.currentLevel]
                    ?.duration || prevState.config.levelDuration,
                ),
              };
            } else {
              // Nível terminou, verificar se precisa de break
              // Verificar se o nível que acabou precisa de break
              const needsBreak = shouldTakeBreak(
                prevState.currentLevel,
                prevState.config.breakInterval,
              );

              if (needsBreak) {
                // Iniciar break
                return {
                  ...prevState,
                  isBreak: true,
                  startTime: new Date(),
                  timeRemaining: calculateTimeRemaining(
                    new Date(),
                    prevState.config.breakDuration,
                  ),
                  history: [
                    ...prevState.history,
                    {
                      level: prevState.currentLevel,
                      smallBlind: currentLevelData.smallBlind,
                      bigBlind: currentLevelData.bigBlind,
                      startTime: prevState.startTime,
                      endTime: new Date(),
                      duration: currentLevelData.duration,
                    },
                  ],
                };
              } else {
                // Ir para próximo nível
                const nextLevel = getNextLevel(
                  prevState.currentLevel,
                  prevState.config.blindStructure.length,
                );
                const nextLevelData =
                  prevState.config.blindStructure[nextLevel - 1];

                return {
                  ...prevState,
                  currentLevel: nextLevel,
                  startTime: new Date(),
                  timeRemaining: calculateTimeRemaining(
                    new Date(),
                    nextLevelData?.duration || prevState.config.levelDuration,
                  ),
                  history: [
                    ...prevState.history,
                    {
                      level: prevState.currentLevel,
                      smallBlind: currentLevelData.smallBlind,
                      bigBlind: currentLevelData.bigBlind,
                      startTime: prevState.startTime,
                      endTime: new Date(),
                      duration: currentLevelData.duration,
                    },
                  ],
                };
              }
            }
          }

          return {
            ...prevState,
            timeRemaining,
          };
        });
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
      timeRemaining: calculateTimeRemaining(
        startTime,
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
    setState((prevState) => {
      if (prevState.isBreak) {
        // Sair do break
        const nextLevelNum = prevState.currentLevel + 1;
        const nextLevelData = prevState.config.blindStructure[nextLevelNum - 1];

        return {
          ...prevState,
          isBreak: false,
          currentLevel: nextLevelNum,
          startTime: new Date(),
          timeRemaining: calculateTimeRemaining(
            new Date(),
            nextLevelData?.duration || prevState.config.levelDuration,
          ),
        };
      } else {
        // Pular nível atual
        const currentLevelData =
          prevState.config.blindStructure[prevState.currentLevel - 1];

        // Verificar se precisa de break após pular o nível atual
        const needsBreak = shouldTakeBreak(
          prevState.currentLevel,
          prevState.config.breakInterval,
        );

        if (needsBreak) {
          // Iniciar break
          return {
            ...prevState,
            isBreak: true,
            startTime: new Date(),
            timeRemaining: calculateTimeRemaining(
              new Date(),
              prevState.config.breakDuration,
            ),
            history: [
              ...prevState.history,
              {
                level: prevState.currentLevel,
                smallBlind: currentLevelData.smallBlind,
                bigBlind: currentLevelData.bigBlind,
                startTime: prevState.startTime || new Date(),
                endTime: new Date(),
                duration: currentLevelData.duration,
              },
            ],
          };
        } else {
          // Ir para próximo nível
          const nextLevelNum = getNextLevel(
            prevState.currentLevel,
            prevState.config.blindStructure.length,
          );
          const nextLevelData =
            prevState.config.blindStructure[nextLevelNum - 1];

          return {
            ...prevState,
            currentLevel: nextLevelNum,
            startTime: new Date(),
            timeRemaining: calculateTimeRemaining(
              new Date(),
              nextLevelData?.duration || prevState.config.levelDuration,
            ),
            history: [
              ...prevState.history,
              {
                level: prevState.currentLevel,
                smallBlind: currentLevelData.smallBlind,
                bigBlind: currentLevelData.bigBlind,
                startTime: prevState.startTime || new Date(),
                endTime: new Date(),
                duration: currentLevelData.duration,
              },
            ],
          };
        }
      }
    });
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
