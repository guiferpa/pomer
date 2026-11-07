import type { TournamentState } from "@/types/tournament";

import { Button, Card, Chip, ProgressBar } from "@heroui/react";
import React, { useState } from "react";

import { PauseIcon, PlayIcon, NextIcon, ResetIcon } from "./icons";
import { HistoryList } from "./history-list";
import { ConfirmModal } from "./confirm-modal";
import { SettingsMenu } from "./settings-menu";

import {
  darkenColor,
  formatTime,
  formatCurrency,
  minutesToSeconds,
} from "@/utils/helpers";
import {
  currentDurationMinutes,
  isLastLevel,
  isTimeUp,
  levelsUntilNextBreak,
} from "@/utils/transitions";
import { trackEvent } from "@/utils/analytics";
import { useI18n, useWakeLock } from "@/hooks";

interface CountdownProps {
  state: TournamentState;
  onToggle: () => void;
  onNextLevel: () => void;
  onReset: () => void;
}

export const Countdown: React.FC<CountdownProps> = ({
  state,
  onToggle,
  onNextLevel,
  onReset,
}) => {
  const [showResetModal, setShowResetModal] = useState(false);
  const { t } = useI18n();
  const { isRunning, history } = state;
  
  // Wake Lock para prevenir hibernação da tela quando o countdown estiver rodando
  useWakeLock(isRunning);

  const currentLevel = state.config.blindStructure[state.currentLevel - 1];
  const nextLevel = state.config.blindStructure[state.currentLevel];

  if (!currentLevel) {
    return (
      <Card className="w-full">
        <Card.Content className="text-center space-y-4">
          <p className="text-muted">{t("noActiveLevel")}</p>
          <Button variant="tertiary" onPress={onReset}>
            {t("reset")}
          </Button>
        </Card.Content>
      </Card>
    );
  }

  const totalTime = minutesToSeconds(currentDurationMinutes(state));

  const progress = ((totalTime - state.timeRemaining) / totalTime) * 100;
  const lastLevel = isLastLevel(state);
  const timeUp = isTimeUp(state);
  const breakIn = levelsUntilNextBreak(state);

  return (
    <div className="space-y-6">
      {/* Linha 1: Card Principal (Blinds + Countdown) */}
      <Card className="w-full">
        <Card.Content className="text-center space-y-4">
          <div className="flex justify-center items-center gap-2">
            <Chip
              color={state.isBreak ? "warning" : "accent"}
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
              variant="soft"
            >
              {state.isBreak
                ? t("break")
                : `${t("level")} ${currentLevel.level}`}
            </Chip>
          </div>

          {state.isBreak ? (
            <div>
              <p className="text-2xl font-bold text-warning">
                {t("break")}
              </p>
              <p className="text-muted">
                {t("next")}: {t("level")} {state.currentLevel + 1}
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
                  <p className="text-lg font-semibold text-muted">
                    {t("smallBlind")}
                  </p>
                </div>

                <div className="text-4xl font-bold text-muted">-</div>

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
                  <p className="text-lg font-semibold text-muted">
                    {t("bigBlind")}
                  </p>
                </div>
              </div>

              {currentLevel.ante !== undefined && (
                <div className="text-center">
                  <p
                    className="text-3xl font-bold"
                    style={{
                      color: state.config.primaryColor,
                      transition: "color 0.8s ease-in-out",
                    }}
                  >
                    {formatCurrency(currentLevel.ante)}
                  </p>
                  <p className="text-base font-semibold text-muted">
                    {t("ante")}
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Cronômetro */}
          <div className="space-y-2">
            <p className="text-4xl font-mono font-bold text-foreground">
              {formatTime(state.timeRemaining)}
            </p>

            {timeUp && (
              <Chip color="danger" size="lg" variant="soft">
                {t("timeUp")}
              </Chip>
            )}

            {state.isBreak ? (
              <ProgressBar
                aria-label={t("break")}
                className="max-w-xs mx-auto"
                color="warning"
                size="md"
                value={progress}
              >
                <ProgressBar.Track>
                  <ProgressBar.Fill />
                </ProgressBar.Track>
              </ProgressBar>
            ) : (
              <div className="max-w-xs mx-auto">
                <div className="w-full bg-default rounded-full h-2">
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
              aria-label={isRunning ? t("pause") : t("resume")}
              className={isRunning ? "bg-warning" : "bg-success"}
              isDisabled={timeUp}
              size="sm"
              variant="primary"
              onPress={() => {
                onToggle();
                trackEvent(isRunning ? "tournament_paused" : "tournament_resumed");
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
              aria-label={t("nextLevel")}
              isDisabled={lastLevel}
              size="sm"
              variant="primary"
              onPress={() => {
                onNextLevel();
                trackEvent("level_skipped",`Level ${state.currentLevel}`);
              }}
            >
              <NextIcon
                size={16}
                style={{ color: darkenColor("#006FEE", 0.4) }}
              />
            </Button>

            <Button
              isIconOnly
              aria-label={t("reset")}
              size="sm"
              // Em 00:00 o reset é o único jeito de encerrar e precisa se destacar
              // dos botões desabilitados ao lado.
              variant={timeUp ? "danger" : "danger-soft"}
              onPress={() => setShowResetModal(true)}
            >
              <ResetIcon
                size={16}
                style={
                  timeUp ? undefined : { color: darkenColor("#EF4444", 0.4) }
                }
              />
            </Button>
          </div>
        </Card.Content>
      </Card>

      {/* Linha 2: Grid com duas colunas */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Coluna Esquerda: Próximo Nível + Break */}
        <div className="space-y-4">
          {/* Próximo Nível */}
          <Card className="w-full">
            <Card.Content className="text-center">
              <h3 className="text-lg font-semibold mb-2">
                {t("nextLevel")}
              </h3>
              <div className="flex justify-center items-center gap-2">
                {lastLevel ? (
                  <Chip color="warning" variant="soft">
                    {t("lastLevel")}
                  </Chip>
                ) : (
                  <>
                    <Chip color="default" variant="soft">
                      {t("level")} {nextLevel.level}
                    </Chip>
                    <span
                      className="text-xl font-bold"
                      style={{
                        color: state.config.primaryColor,
                        transition: "color 0.8s ease-in-out",
                      }}
                    >
                      {formatCurrency(nextLevel.smallBlind)} /{" "}
                      {formatCurrency(nextLevel.bigBlind)}
                    </span>
                    {nextLevel.ante !== undefined && (
                      <span
                        className="text-base font-bold"
                        style={{
                          color: state.config.primaryColor,
                          transition: "color 0.8s ease-in-out",
                        }}
                      >
                        {`${t("ante")} ${formatCurrency(nextLevel.ante)}`}
                      </span>
                    )}
                  </>
                )}
              </div>
            </Card.Content>
          </Card>

          {/* Informações do Break */}
          <Card className="w-full">
            <Card.Content className="text-center">
              <h3 className="text-lg font-semibold mb-2">
                {t("break")}
              </h3>
              {state.isBreak ? (
                <div>
                  <p className="text-warning font-semibold">
                    {t("happening")}
                  </p>
                  <p className="text-sm text-muted">
                    {t("duration")}: {state.config.breakDuration}{" "}
                    {t("minutes")}
                  </p>
                </div>
              ) : breakIn === null ? (
                <p className="text-muted">{t("noMoreBreaks")}</p>
              ) : (
                <div>
                  <p className="text-muted">
                    {breakIn === 1
                      ? t("nextBreakIn") +
                        ` 1 ${t("levelSingular")}`
                      : t("nextBreakIn") +
                        ` ${breakIn} ${t("levelPlural")}`}
                  </p>
                  <p className="text-sm text-muted">
                    {t("duration")}: {state.config.breakDuration}{" "}
                    {t("minutes")}
                  </p>
                </div>
              )}
            </Card.Content>
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
        cancelText={t("cancel")}
        confirmVariant="danger"
        confirmText={t("confirm")}
        isOpen={showResetModal}
        message={t("resetMessage")}
        title={t("confirmReset")}
        onClose={() => setShowResetModal(false)}
        onConfirm={onReset}
      />
    </div>
  );
};
