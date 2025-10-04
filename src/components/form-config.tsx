import type { TournamentConfig } from "@/types/tournament";

import React, { useState, useEffect } from "react";
import {
  Card,
  CardBody,
  CardHeader,
  Input,
  Button,
  Select,
  SelectItem,
} from "@heroui/react";
import { useTheme } from "@heroui/use-theme";

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
  const { theme, setTheme } = useTheme();
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
        <CardHeader className="flex flex-col gap-1 flex-shrink-0">
          <div className="flex items-center justify-center gap-2">
            <Logo color={selectedColor} size={32} />
            <h1 className="text-2xl font-bold">{t("appName")}</h1>
          </div>
          <p className="text-center text-default-500">
            {t("tournamentConfiguration")}
          </p>
        </CardHeader>
        <CardBody className="flex flex-col overflow-hidden">
          <form className="flex flex-col justify-between" onSubmit={handleSubmit}>
            <div className="overflow-y-auto space-y-6">
            <Input
              isRequired
              label={t("tournamentNameLabel")}
              placeholder={t("tournamentNameLabel")}
              value={config.name}
              onChange={(e) =>
                setConfig((prev) => ({ ...prev, name: e.target.value }))
              }
            />

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Input
                isRequired
                label={t("levelDuration")}
                max="60"
                min="1"
                type="number"
                value={config.levelDuration.toString()}
                onChange={(e) =>
                  setConfig((prev) => ({
                    ...prev,
                    levelDuration: parseInt(e.target.value) || 20,
                  }))
                }
              />

              <Input
                isRequired
                label={t("breakInterval")}
                max="10"
                min="1"
                type="number"
                value={config.breakInterval.toString()}
                onChange={(e) =>
                  setConfig((prev) => ({
                    ...prev,
                    breakInterval: parseInt(e.target.value) || 3,
                  }))
                }
              />

              <Input
                isRequired
                label={t("breakDuration")}
                max="30"
                min="1"
                type="number"
                value={config.breakDuration.toString()}
                onChange={(e) =>
                  setConfig((prev) => ({
                    ...prev,
                    breakDuration: parseInt(e.target.value) || 10,
                  }))
                }
              />
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
                        : "border-default-200 hover:border-default-300"
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
                    <span className="text-xs font-medium text-default-600">
                      {option.label}
                    </span>
                  </button>
                ))}
              </div>
              <p className="text-xs text-default-400 mt-2">
                {t("chooseColorDescription" as any)}
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">
                {t("interfaceTheme")}
              </label>
              <Select
                selectedKeys={[theme]}
                onSelectionChange={(keys) => {
                  const value = Array.from(keys)[0] as string;

                  setTheme(value as "light" | "dark");
                }}
              >
                {getThemeOptions(t).map((option) => (
                  <SelectItem key={option.key}>{option.label}</SelectItem>
                ))}
              </Select>
              <p className="text-xs text-default-400 mt-2">
                {t("chooseThemeDescription" as any)}
              </p>
            </div>

            <LanguageSelector />

            <div>
              <label className="block text-sm font-medium mb-2">
                {t("blindStructure")}
              </label>
              <Select
                placeholder={t("selectStructurePlaceholder" as any)}
                selectedKeys={[selectedStructure]}
                onSelectionChange={(keys) => {
                  const value = Array.from(keys)[0] as string;

                  handleStructureChange(value);
                }}
              >
                {getStructureOptions(t).map((option) => (
                  <SelectItem key={option.key}>{option.label}</SelectItem>
                ))}
              </Select>
            </div>

            <div>
              <h3 className="text-lg font-semibold mb-3">
                {t("structurePreview")}
              </h3>
              <div className="grid grid-cols-1 gap-2">
                {config.blindStructure.slice(0, 3).map((level) => (
                  <div
                    key={level.level}
                    className="flex justify-between items-center p-2 bg-default-100 rounded-lg"
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
                  <p className="text-center text-default-500 text-sm">
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
                color="primary"
                size="lg"
                style={{
                  backgroundColor: selectedColor,
                  color: "white",
                  transition: "background-color 0.8s ease-in-out",
                }}
                type="submit"
              >
                {t("startTournament")}
              </Button>
            </div>
          </form>
        </CardBody>
      </Card>
    </div>
  );
};
