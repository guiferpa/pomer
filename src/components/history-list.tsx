import type { LevelHistory } from "@/types/tournament";

import React from "react";
import { Card, CardBody, CardHeader, Chip } from "@heroui/react";

import { formatCurrency } from "@/utils/helpers";
import { useI18n } from "@/hooks";

interface HistoryListProps {
  history: LevelHistory[];
  primaryColor: string;
}

export const HistoryList: React.FC<HistoryListProps> = ({
  history,
  primaryColor,
}) => {
  const { t } = useI18n();

  return (
    <Card className="w-full">
      <CardHeader>
        <h3 className="text-lg font-semibold">{t("levelHistory" as any)}</h3>
      </CardHeader>
      <CardBody>
        <div className="space-y-1 max-h-60 overflow-y-auto">
          {history
            .slice()
            .reverse()
            .slice(0, 3)
            .map((level) => (
              <div
                key={level.level}
                className="flex items-center justify-between p-2"
              >
                <div className="flex items-center gap-3">
                  <Chip color="success" size="sm" variant="flat">
                    ✓
                  </Chip>
                  <span className="font-medium">
                    {t("level" as any)} {level.level}
                  </span>
                </div>
                <div className="text-right">
                  <span
                    className="font-bold"
                    style={{
                      color: primaryColor,
                      transition: "color 0.8s ease-in-out",
                    }}
                  >
                    {formatCurrency(level.smallBlind)}/
                    {formatCurrency(level.bigBlind)}
                  </span>
                  <p className="text-xs text-default-500">
                    {level.duration}min
                  </p>
                </div>
              </div>
            ))}

          {history.length === 0 && (
            <div className="text-center text-default-500 py-4">
              <p>{t("noLevelsPlayedYet" as any)}</p>
            </div>
          )}
        </div>
      </CardBody>
    </Card>
  );
};
