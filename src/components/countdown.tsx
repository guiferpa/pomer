import type { TournamentState, LevelHistory } from "@/types/tournament";

import { Card, CardBody, Progress, Chip, Button } from "@heroui/react";
import React, { useState } from "react";

import { PauseIcon, PlayIcon, NextIcon, ResetIcon } from "./icons";
import { HistoryList } from "./history-list";
import { ConfirmModal } from "./confirm-modal";
import { SettingsMenu } from "./settings-menu";

import { formatTime, formatCurrency } from "@/utils/helpers";
import { useI18n, useAnalytics, useAudio, useWakeLock } from "@/hooks";

interface CountdownProps {
  state: TournamentState;
  isRunning: boolean;
  onToggle: () => void;
  onNextLevel: () => void;
  onReset: () => void;
  history: LevelHistory[];
}

// Função para escurecer uma cor
const darkenColor = (color: string, amount: number = 0.3): string => {
  // Remove o # se presente
  const hex = color.replace("#", "");

  // Converte para RGB
  const r = parseInt(hex.substr(0, 2), 16);
  const g = parseInt(hex.substr(2, 2), 16);
  const b = parseInt(hex.substr(4, 2), 16);

  // Escurece a cor
  const newR = Math.floor(r * (1 - amount));
  const newG = Math.floor(g * (1 - amount));
  const newB = Math.floor(b * (1 - amount));

  // Converte de volta para hex
  return `#${newR.toString(16).padStart(2, "0")}${newG.toString(16).padStart(2, "0")}${newB.toString(16).padStart(2, "0")}`;
};

export const Countdown: React.FC<CountdownProps> = ({
  state,
  isRunning,
  onToggle,
  onNextLevel,
  onReset,
  history,
}) => {
  const [showResetModal, setShowResetModal] = useState(false);
  const { t } = useI18n();
  const { trackEvent } = useAnalytics();
  const { playSound } = useAudio();
  
  // Wake Lock para prevenir hibernação da tela quando o countdown estiver rodando
  useWakeLock({
    enabled: isRunning,
    onError: (error) => {
      console.warn('Wake Lock não disponível:', error.message);
    },
    onRelease: () => {
      console.log('Wake Lock liberado');
    },
  });

  const currentLevel = state.config.blindStructure[state.currentLevel - 1];
  const nextLevel = state.config.blindStructure[state.currentLevel];

  if (!currentLevel) {
    return (
      <Card className="w-full">
        <CardBody className="text-center space-y-4">
          <p className="text-default-500">{t("noActiveLevel" as any)}</p>
          <Button
            color="primary"
            variant="flat"
            onClick={onReset}
          >
            {t("reset" as any)}
          </Button>
        </CardBody>
      </Card>
    );
  }

  const totalTime = state.isBreak
    ? state.config.breakDuration * 60
    : currentLevel.duration * 60;

  const progress = ((totalTime - state.timeRemaining) / totalTime) * 100;

  return (
    <div className="space-y-6">
      {/* Linha 1: Card Principal (Blinds + Countdown) */}
      <Card className="w-full">
        <CardBody className="text-center space-y-4">
          <div className="flex justify-center items-center gap-2">
            <Chip
              color={state.isBreak ? "warning" : "primary"}
              size="lg"
              style={
                !state.isBreak
                  ? {
                      backgroundColor: state.config.primaryColor + "20",
                      color: state.config.primaryColor,
                      transition:
                        "color 0.8s ease-in-out, background-color 0.8s ease-in-out",
                    }
                  : undefined
              }
              variant="flat"
            >
              {state.isBreak
                ? t("break" as any)
                : `${t("level" as any)} ${currentLevel.level}`}
            </Chip>
          </div>

          {state.isBreak ? (
            <div>
              <p className="text-2xl font-bold text-warning">
                {t("break" as any)}
              </p>
              <p className="text-default-500">
                {t("next" as any)}: {t("level" as any)} {state.currentLevel + 1}
              </p>
            </div>
          ) : (
            <div className="space-y-2 mb-6">
              <div className="flex items-center justify-center gap-6">
                <div className="text-center">
                  <p
                    className="text-5xl font-bold mb-1"
                    style={{
                      color: state.config.primaryColor,
                      transition: "color 0.8s ease-in-out",
                    }}
                  >
                    {formatCurrency(currentLevel.smallBlind)}
                  </p>
                  <p className="text-lg font-semibold text-default-500">
                    {t("smallBlind" as any)}
                  </p>
                </div>

                <div className="text-4xl font-bold text-default-400">-</div>

                <div className="text-center">
                  <p
                    className="text-5xl font-bold mb-1"
                    style={{
                      color: state.config.primaryColor,
                      transition: "color 0.8s ease-in-out",
                    }}
                  >
                    {formatCurrency(currentLevel.bigBlind)}
                  </p>
                  <p className="text-lg font-semibold text-default-500">
                    {t("bigBlind" as any)}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Cronômetro */}
          <div className="space-y-2">
            <p className="text-4xl font-mono font-bold text-foreground">
              {formatTime(state.timeRemaining)}
            </p>

            {state.isBreak ? (
              <Progress
                className="max-w-xs mx-auto"
                color="warning"
                size="md"
                value={progress}
              />
            ) : (
              <div className="max-w-xs mx-auto">
                <div className="w-full bg-default-200 rounded-full h-2">
                  <div
                    className="h-2 rounded-full transition-all duration-300"
                    style={{
                      width: `${progress}%`,
                      backgroundColor: state.config.primaryColor,
                    }}
                  />
                </div>
              </div>
            )}
          </div>

          {/* Controles */}
          <div className="flex justify-center gap-3 mt-4">
            <SettingsMenu />

            <Button
              isIconOnly
              aria-label={isRunning ? t("pause" as any) : t("resume" as any)}
              color={isRunning ? "warning" : "success"}
              size="sm"
              onClick={() => {
                onToggle();
                trackEvent(isRunning ? "tournament_paused" : "tournament_resumed", "Tournament");
              }}
            >
              {isRunning ? (
                <PauseIcon
                  size={16}
                  style={{ color: darkenColor("#F59E0B", 0.4) }}
                />
              ) : (
                <PlayIcon
                  size={16}
                  style={{ color: darkenColor("#10B981", 0.4) }}
                />
              )}
            </Button>

            <Button
              isIconOnly
              aria-label={t("nextLevel" as any)}
              color="primary"
              size="sm"
              onClick={() => {
                onNextLevel();
                trackEvent("level_skipped", "Tournament", `Level ${state.currentLevel}`);
                playSound("level_change");
              }}
            >
              <NextIcon
                size={16}
                style={{ color: darkenColor("#006FEE", 0.4) }}
              />
            </Button>

            <Button
              isIconOnly
              aria-label={t("reset" as any)}
              color="danger"
              size="sm"
              variant="flat"
              onClick={() => setShowResetModal(true)}
            >
              <ResetIcon
                size={16}
                style={{ color: darkenColor("#EF4444", 0.4) }}
              />
            </Button>
          </div>
        </CardBody>
      </Card>

      {/* Linha 2: Grid com duas colunas */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Coluna Esquerda: Próximo Nível + Break */}
        <div className="space-y-4">
          {/* Próximo Nível */}
          <Card className="w-full">
            <CardBody className="text-center">
              <h3 className="text-lg font-semibold mb-2">
                {t("nextLevel" as any)}
              </h3>
              <div className="flex justify-center items-center gap-2">
                <Chip color="default" variant="flat">
                  {t("level" as any)}{" "}
                  {state.isBreak
                    ? state.currentLevel + 1
                    : nextLevel
                      ? nextLevel.level
                      : state.currentLevel + 1}
                </Chip>
                <span
                  className="text-xl font-bold"
                  style={{
                    color: state.config.primaryColor,
                    transition: "color 0.8s ease-in-out",
                  }}
                >
                  {(() => {
                    const nextLevelData = state.isBreak
                      ? state.config.blindStructure[state.currentLevel]
                      : nextLevel;

                    return nextLevelData
                      ? `${formatCurrency(nextLevelData.smallBlind)} / ${formatCurrency(nextLevelData.bigBlind)}`
                      : "N/A";
                  })()}
                </span>
              </div>
            </CardBody>
          </Card>

          {/* Informações do Break */}
          <Card className="w-full">
            <CardBody className="text-center">
              <h3 className="text-lg font-semibold mb-2">
                {t("break" as any)}
              </h3>
              {state.isBreak ? (
                <div>
                  <p className="text-warning font-semibold">
                    {t("happening" as any)}
                  </p>
                  <p className="text-sm text-default-400">
                    {t("duration" as any)}: {state.config.breakDuration}{" "}
                    {t("minutes" as any)}
                  </p>
                </div>
              ) : (
                <div>
                  <p className="text-default-500">
                    {(() => {
                      const levelsUntilBreak =
                        state.config.breakInterval -
                        ((state.currentLevel - 1) % state.config.breakInterval);

                      return levelsUntilBreak === 1
                        ? t("nextBreakIn" as any) +
                            ` 1 ${t("levelSingular" as any)}`
                        : t("nextBreakIn" as any) +
                            ` ${levelsUntilBreak} ${t("levelPlural" as any)}`;
                    })()}
                  </p>
                  <p className="text-sm text-default-400">
                    {t("duration" as any)}: {state.config.breakDuration}{" "}
                    {t("minutes" as any)}
                  </p>
                </div>
              )}
            </CardBody>
          </Card>
        </div>

        {/* Coluna Direita: Histórico */}
        <div>
          <HistoryList
            history={history}
            primaryColor={state.config.primaryColor}
          />
        </div>
      </div>

      {/* Modal de Confirmação de Reset */}
      <ConfirmModal
        cancelText={t("cancel" as any)}
        confirmColor="danger"
        confirmText={t("confirm" as any)}
        isOpen={showResetModal}
        message={t("resetMessage" as any)}
        title={t("confirmReset" as any)}
        onClose={() => setShowResetModal(false)}
        onConfirm={onReset}
      />
    </div>
  );
};
