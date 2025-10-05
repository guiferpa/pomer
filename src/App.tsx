import type { TournamentConfig } from "@/types/tournament";

import { useEffect } from "react";
import { HeroUIProvider } from "@heroui/react";

import { useTournament, useLocalStorage, useAnalytics, useAudio } from "@/hooks";
import { MainLayout, ConfigForm, Countdown, Logo } from "@/components";
import { I18nProvider } from "@/contexts/I18nContext";

function App() {
  const [savedConfig, setSavedConfig] =
    useLocalStorage<TournamentConfig | null>("pomer-config", null);

  const {
    state,
    startTournament,
    toggleTournament,
    nextLevel,
    resetTournament,
  } = useTournament();

  const { trackEvent } = useAnalytics();
  const { playSound } = useAudio();

  // Verificar se o torneio está configurado e válido
  const isConfigured = state.config.blindStructure.length > 0 && 
    state.currentLevel <= state.config.blindStructure.length;

  // Detectar mudanças de nível para tocar som
  useEffect(() => {
    if (isConfigured && state.currentLevel > 1) {
      playSound("level_change");
    }
  }, [state.currentLevel, isConfigured]);

  // Atualizar título da página
  useEffect(() => {
    const projectName = "Pomer";

    if (isConfigured) {
      document.title = `${state.config.name} - ${projectName}`;
    } else {
      document.title = `Configuração - ${projectName}`;
    }
  }, [isConfigured, state.config.name]);

  const handleStartTournament = (config: TournamentConfig) => {
    setSavedConfig(config);
    startTournament(config);
    trackEvent("tournament_started", "Tournament", config.name);
  };

  const handleReset = () => {
    resetTournament();
    trackEvent("tournament_reset", "Tournament");
  };

  return (
    <HeroUIProvider>
      <I18nProvider>
        <MainLayout>
          {!isConfigured ? (
            <ConfigForm
              initialConfig={savedConfig || undefined}
              onStart={handleStartTournament}
            />
          ) : (
            <div className="space-y-6">
              {/* Header */}
              <div className="text-center">
                <h1 className="text-2xl font-bold">{state.config.name}</h1>
                <div className="flex items-center justify-center gap-2">
                  <Logo className="text-default-500" size={16} />
                  <span className="text-sm text-default-500">Pomer</span>
                </div>
              </div>

              {/* Cronômetro Principal */}
              <Countdown
                history={state.history}
                isRunning={state.isRunning}
                state={state}
                onNextLevel={nextLevel}
                onReset={handleReset}
                onToggle={toggleTournament}
              />
            </div>
          )}
        </MainLayout>
      </I18nProvider>
    </HeroUIProvider>
  );
}

export default App;
