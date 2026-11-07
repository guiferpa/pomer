import type { TournamentConfig } from "@/types/tournament";

import { useEffect, useState } from "react";

import { useRoute, useTournament } from "@/hooks";
import { trackEvent } from "@/utils/analytics";
import {
  MainLayout,
  ConfigForm,
  Countdown,
  Logo,
  StructuresScreen,
} from "@/components";
import { I18nProvider } from "@/contexts/I18nContext";
import { loadConfig, saveConfig } from "@/utils/persistence";

function App() {
  const [savedConfig, setSavedConfig] = useState(loadConfig);
  const { route, navigate } = useRoute();

  const {
    state,
    startTournament,
    toggleTournament,
    nextLevel,
    resetTournament,
    savedTournamentLost,
  } = useTournament();

  // O aviso vale só até o organizador começar outro torneio, e nunca é gravado.
  const [showLostWarning, setShowLostWarning] = useState(savedTournamentLost);

  // Verificar se o torneio está configurado e válido
  const isConfigured = state.config.blindStructure.length > 0 && 
    state.currentLevel <= state.config.blindStructure.length;

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
    saveConfig(config);
    setSavedConfig(config);
    setShowLostWarning(false);
    startTournament(config);
    trackEvent("tournament_started", config.name);
  };

  const handleReset = () => {
    resetTournament();
    trackEvent("tournament_reset");
  };

  return (
    <I18nProvider>
      <MainLayout>
        {route === "structures" ? (
          <StructuresScreen onBack={() => navigate("main")} />
        ) : !isConfigured ? (
          <ConfigForm
            initialConfig={savedConfig || undefined}
            savedTournamentLost={showLostWarning}
            onStart={handleStartTournament}
          />
        ) : (
          <div className="space-y-6">
            {/* Header */}
            <div className="text-center">
              <h1 className="text-2xl font-bold">{state.config.name}</h1>
              <div className="flex items-center justify-center gap-2">
                <Logo className="text-muted" size={16} />
                <span className="text-sm text-muted">Pomer</span>
              </div>
            </div>

            {/* Cronômetro Principal */}
            <Countdown
              state={state}
              onNextLevel={nextLevel}
              onReset={handleReset}
              onToggle={toggleTournament}
            />
          </div>
        )}
      </MainLayout>
    </I18nProvider>
  );
}

export default App;
