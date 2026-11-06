import type { TournamentConfig } from "@/types/tournament";

import React, { useState } from "react";
import {
  Button,
  Card,
  Chip,
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

import {
  DEFAULT_STRUCTURE,
  buildStructure,
  deduceStructure,
  isStructureName,
  structureDuration,
  type StructureName,
} from "@/utils/structures";
import { useI18n } from "@/hooks";

interface ConfigFormProps {
  onStart: (config: TournamentConfig) => void;
  initialConfig?: TournamentConfig;
  // O torneio salvo era inválido e foi descartado.
  savedTournamentLost?: boolean;
}

// Os campos numéricos guardam o texto digitado, que só vira número ao iniciar.
type NumberField = "levelDuration" | "breakInterval" | "breakDuration";

type Draft = Omit<TournamentConfig, "blindStructure" | "structure" | NumberField> &
  Record<NumberField, string> & {
    structure: StructureName;
  };

const toDraft = (config?: TournamentConfig): Draft => {
  if (!config) {
    return {
      name: "Torneio Pomer",
      levelDuration: String(structureDuration(DEFAULT_STRUCTURE)),
      breakInterval: "3",
      breakDuration: "10",
      structure: DEFAULT_STRUCTURE,
      primaryColor: "#006FEE",
    };
  }

  const { blindStructure, structure, ...rest } = config;

  return {
    ...rest,
    levelDuration: String(config.levelDuration),
    breakInterval: String(config.breakInterval),
    breakDuration: String(config.breakDuration),
    structure: structure ?? deduceStructure(blindStructure),
  };
};

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
  savedTournamentLost = false,
}) => {
  const { resolvedTheme, setTheme } = useTheme();
  const { t } = useI18n();

  // O que o organizador escolheu e digitou. A configuração do torneio, com os
  // níveis, só é montada ao iniciar.
  const [draft, setDraft] = useState<Draft>(() => toDraft(initialConfig));
  const { structure, primaryColor: selectedColor } = draft;
  // Enquanto a duração está vazia ou inválida, a prévia usa a da estrutura.
  const previewDuration = Number(draft.levelDuration);
  const preview = buildStructure(
    structure,
    Number.isInteger(previewDuration) && previewDuration > 0
      ? previewDuration
      : structureDuration(structure),
  );

  const update = (changes: Partial<Draft>) =>
    setDraft((prev) => ({ ...prev, ...changes }));

  // Cada estrutura traz a própria duração e sobrescreve a que estava digitada.
  const handleStructureChange = (name: StructureName) =>
    update({ structure: name, levelDuration: String(structureDuration(name)) });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onStart({
      ...draft,
      levelDuration: Number(draft.levelDuration),
      breakInterval: Number(draft.breakInterval),
      breakDuration: Number(draft.breakDuration),
      blindStructure: preview,
    });
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
          {savedTournamentLost && (
            <Chip
              className="self-center h-auto text-center whitespace-normal"
              color="warning"
              role="status"
              size="lg"
              variant="soft"
            >
              {t("savedTournamentLost")}
            </Chip>
          )}
        </Card.Header>
        <Card.Content className="flex flex-col overflow-hidden">
          <form className="flex flex-col justify-between" onSubmit={handleSubmit}>
            <div className="overflow-y-auto space-y-6">
            <TextField isRequired name="name">
              <Label>{t("tournamentNameLabel")}</Label>
              <Input
                variant="secondary"
                placeholder={t("tournamentNameLabel")}
                value={draft.name}
                onChange={(e) =>
                  update({ name: e.target.value })
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
                  value={draft.levelDuration}
                  onChange={(e) => update({ levelDuration: e.target.value })}
                />
              </TextField>

              <TextField isRequired name="breakInterval" type="number">
                <Label>{t("breakInterval")}</Label>
                <Input
                  variant="secondary"
                  max="10"
                  min="1"
                  value={draft.breakInterval}
                  onChange={(e) => update({ breakInterval: e.target.value })}
                />
              </TextField>

              <TextField isRequired name="breakDuration" type="number">
                <Label>{t("breakDuration")}</Label>
                <Input
                  variant="secondary"
                  max="30"
                  min="1"
                  value={draft.breakDuration}
                  onChange={(e) => update({ breakDuration: e.target.value })}
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
                    onClick={() => update({ primaryColor: option.key })}
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
              value={structure}
              onChange={(key) => {
                if (isStructureName(key)) {
                  handleStructureChange(key);
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
                {preview.slice(0, 3).map((level) => (
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
                {preview.length > 3 && (
                  <p className="text-center text-muted text-sm">
                    ... {t("andMore")} {preview.length - 3}{" "}
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
