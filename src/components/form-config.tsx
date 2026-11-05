import type { TournamentConfig } from "@/types/tournament";

import React, { useState, useEffect } from "react";
import {
  Button,
  Card,
  Description,
  Input,
  Label,
  ListBox,
  Select,
  TextField,
  useTheme,
} from "@heroui/react";

import { Logo } from "./logo";
import { LanguageSelector } from "./language-selector";

import { defaultStructures } from "@/config/tournament";
import { generateBlindLevels } from "@/utils/helpers";
import { useI18n } from "@/hooks";

interface ConfigFormProps {
  onStart: (config: TournamentConfig) => void;
  initialConfig?: TournamentConfig;
}

const getStructureOptions = (t: (key: any) => string) => [
  { key: "small", label: t("structureSmall") },
  { key: "medium", label: t("structureMedium") },
  { key: "large", label: t("structureLarge") },
  { key: "turbo", label: t("structureTurbo") },
];

const getColorOptions = (t: (key: any) => string) => [
  { key: "#006FEE", label: t("blue"), color: "#006FEE" },
  { key: "#FF6B6B", label: t("red"), color: "#FF6B6B" },
  { key: "#51CF66", label: t("green"), color: "#51CF66" },
  { key: "#FF922B", label: t("orange"), color: "#FF922B" },
  { key: "#9775FA", label: t("purple"), color: "#9775FA" },
  { key: "#20C997", label: t("turquoise"), color: "#20C997" },
  { key: "#F783AC", label: t("pink"), color: "#F783AC" },
  { key: "#FFD43B", label: t("yellow"), color: "#FFD43B" },
];

const getThemeOptions = (t: (key: any) => string) => [
  { key: "light", label: t("lightMode") },
  { key: "dark", label: t("darkMode") },
];

export const ConfigForm: React.FC<ConfigFormProps> = ({
  onStart,
  initialConfig,
}) => {
  const { resolvedTheme, setTheme } = useTheme();
  const { t } = useI18n();

  const [config, setConfig] = useState<TournamentConfig>(
    initialConfig || {
      name: "Torneio Pomer",
      levelDuration: 20,
      breakInterval: 3,
      breakDuration: 10,
      blindStructure: defaultStructures.medium,
      primaryColor: "#006FEE",
    },
  );

  const [selectedStructure, setSelectedStructure] = useState("medium");
  const [selectedColor, setSelectedColor] = useState("#006FEE");

  // Atualizar estrutura quando a duração mudar
  useEffect(() => {
    setConfig((prev) => {
      const structure =
        defaultStructures[selectedStructure as keyof typeof defaultStructures];
      const startBlind = structure[0]?.smallBlind || 50;
      const levels = structure.length;
      const newStructure = generateBlindLevels(
        startBlind,
        levels,
        prev.levelDuration,
      );

      return {
        ...prev,
        blindStructure: newStructure,
      };
    });
  }, [config.levelDuration, selectedStructure]);

  // Atualizar cor quando selecionada
  useEffect(() => {
    setConfig((prev) => ({
      ...prev,
      primaryColor: selectedColor,
    }));
  }, [selectedColor]);

  const handleStructureChange = (value: string) => {
    setSelectedStructure(value);
    setConfig((prev) => {
      const structure =
        defaultStructures[value as keyof typeof defaultStructures];
      // Regenerar a estrutura com a duração atual configurada
      const startBlind = structure[0]?.smallBlind || 50;
      const levels = structure.length;
      const newStructure = generateBlindLevels(
        startBlind,
        levels,
        prev.levelDuration,
      );

      return {
        ...prev,
        blindStructure: newStructure,
      };
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onStart(config);
  };

  return (
    <div className="w-full max-w-2xl mx-auto flex flex-col">
      <Card className="flex-1 flex flex-col">
        <Card.Header className="flex flex-col gap-1 flex-shrink-0">
          <div className="flex items-center justify-center gap-2">
            <Logo color={selectedColor} size={32} />
            <h1 className="text-2xl font-bold">{t("appName")}</h1>
          </div>
          <p className="text-center text-muted">
            {t("tournamentConfiguration")}
          </p>
        </Card.Header>
        <Card.Content className="flex flex-col overflow-hidden">
          <form className="flex flex-col justify-between" onSubmit={handleSubmit}>
            <div className="overflow-y-auto space-y-6">
            <TextField isRequired name="name">
              <Label>{t("tournamentNameLabel")}</Label>
              <Input
                variant="secondary"
                placeholder={t("tournamentNameLabel")}
                value={config.name}
                onChange={(e) =>
                  setConfig((prev) => ({ ...prev, name: e.target.value }))
                }
              />
            </TextField>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <TextField isRequired name="levelDuration" type="number">
                <Label>{t("levelDuration")}</Label>
                <Input
                  variant="secondary"
                  max="60"
                  min="1"
                  value={config.levelDuration.toString()}
                  onChange={(e) =>
                    setConfig((prev) => ({
                      ...prev,
                      levelDuration: parseInt(e.target.value) || 20,
                    }))
                  }
                />
              </TextField>

              <TextField isRequired name="breakInterval" type="number">
                <Label>{t("breakInterval")}</Label>
                <Input
                  variant="secondary"
                  max="10"
                  min="1"
                  value={config.breakInterval.toString()}
                  onChange={(e) =>
                    setConfig((prev) => ({
                      ...prev,
                      breakInterval: parseInt(e.target.value) || 3,
                    }))
                  }
                />
              </TextField>

              <TextField isRequired name="breakDuration" type="number">
                <Label>{t("breakDuration")}</Label>
                <Input
                  variant="secondary"
                  max="30"
                  min="1"
                  value={config.breakDuration.toString()}
                  onChange={(e) =>
                    setConfig((prev) => ({
                      ...prev,
                      breakDuration: parseInt(e.target.value) || 10,
                    }))
                  }
                />
              </TextField>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">
                {t("primaryColor")}
              </label>
              <div className="grid grid-cols-4 gap-2">
                {getColorOptions(t).map((option) => (
                  <button
                    key={option.key}
                    className={`
                    flex flex-col items-center gap-1 p-3 rounded-lg border-2 transition-all
                    ${
                      selectedColor === option.key
                        ? "border-2"
                        : "border-border hover:border-muted"
                    }
                  `}
                    style={{
                      borderColor:
                        selectedColor === option.key ? option.color : undefined,
                      backgroundColor:
                        selectedColor === option.key
                          ? `${option.color}20`
                          : undefined,
                    }}
                    type="button"
                    onClick={() => setSelectedColor(option.key)}
                  >
                    <div
                      className="w-6 h-6 rounded-full border-2 border-white shadow-sm"
                      style={{ backgroundColor: option.color }}
                    />
                    <span className="text-xs font-medium text-muted">
                      {option.label}
                    </span>
                  </button>
                ))}
              </div>
              <p className="text-xs text-muted mt-2">
                {t("chooseColorDescription" as any)}
              </p>
            </div>

            <Select
              variant="secondary"
              value={resolvedTheme}
              onChange={(key) => {
                if (key) {
                  setTheme(String(key));
                }
              }}
            >
              <Label className="block text-sm font-medium mb-2">
                {t("interfaceTheme")}
              </Label>
              <Select.Trigger>
                <Select.Value />
                <Select.Indicator />
              </Select.Trigger>
              <Description className="block text-xs text-muted mt-2">
                {t("chooseThemeDescription" as any)}
              </Description>
              <Select.Popover>
                <ListBox>
                  {getThemeOptions(t).map((option) => (
                    <ListBox.Item
                      key={option.key}
                      id={option.key}
                      textValue={option.label}
                    >
                      {option.label}
                      <ListBox.ItemIndicator />
                    </ListBox.Item>
                  ))}
                </ListBox>
              </Select.Popover>
            </Select>

            <LanguageSelector />

            <Select
              variant="secondary"
              placeholder={t("selectStructurePlaceholder" as any)}
              value={selectedStructure}
              onChange={(key) => {
                if (key) {
                  handleStructureChange(String(key));
                }
              }}
            >
              <Label className="block text-sm font-medium mb-2">
                {t("blindStructure")}
              </Label>
              <Select.Trigger>
                <Select.Value />
                <Select.Indicator />
              </Select.Trigger>
              <Select.Popover>
                <ListBox>
                  {getStructureOptions(t).map((option) => (
                    <ListBox.Item
                      key={option.key}
                      id={option.key}
                      textValue={option.label}
                    >
                      {option.label}
                      <ListBox.ItemIndicator />
                    </ListBox.Item>
                  ))}
                </ListBox>
              </Select.Popover>
            </Select>

            <div>
              <h3 className="text-lg font-semibold mb-3">
                {t("structurePreview")}
              </h3>
              <div className="grid grid-cols-1 gap-2">
                {config.blindStructure.slice(0, 3).map((level) => (
                  <div
                    key={level.level}
                    className="flex justify-between items-center p-2 bg-surface-secondary rounded-lg"
                  >
                    <span className="font-medium">
                      {t("level")} {level.level}
                    </span>
                    <span
                      className="font-bold"
                      style={{
                        color: selectedColor,
                        transition: "color 0.8s ease-in-out",
                      }}
                    >
                      {level.smallBlind}/{level.bigBlind}
                    </span>
                  </div>
                ))}
                {config.blindStructure.length > 3 && (
                  <p className="text-center text-muted text-sm">
                    ... {t("andMore")} {config.blindStructure.length - 3}{" "}
                    {t("levels")}
                  </p>
                )}
              </div>
            </div>
          </div>

            <div className="pt-6">
              <Button
                className="w-full"
                size="lg"
                style={{
                  backgroundColor: selectedColor,
                  color: "white",
                  transition: "background-color 0.8s ease-in-out",
                }}
                type="submit"
                variant="primary"
              >
                {t("startTournament")}
              </Button>
            </div>
          </form>
        </Card.Content>
      </Card>
    </div>
  );
};
