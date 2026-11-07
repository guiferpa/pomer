import type { TranslationKeys } from "@/i18n/translations";
import {
  STRUCTURE_NAMES,
  type StructureName,
  type TournamentConfig,
} from "@/types/tournament";

import React, { useState } from "react";
import {
  Alert,
  Button,
  Card,
  FieldError,
  Input,
  Label,
  ListBox,
  Select,
  TextField,
} from "@heroui/react";

import { Logo } from "./logo";
import { SettingsMenu } from "./settings-menu";

import {
  DEFAULT_STRUCTURE,
  buildStructure,
  deduceStructure,
  isStructureName,
  structureDuration,
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

const NUMBER_LIMITS: Record<NumberField, { min: number; max: number }> = {
  levelDuration: { min: 1, max: 60 },
  breakInterval: { min: 1, max: 10 },
  breakDuration: { min: 1, max: 30 },
};

const NUMBER_FIELDS = Object.keys(NUMBER_LIMITS) as NumberField[];

type FieldErrors = Partial<Record<NumberField, string>>;

type Translate = (key: TranslationKeys) => string;

const validateNumbers = (
  draft: Draft,
  t: Translate,
): FieldErrors => {
  const errors: FieldErrors = {};

  for (const field of NUMBER_FIELDS) {
    const text = draft[field].trim();
    const value = Number(text);
    const { min, max } = NUMBER_LIMITS[field];

    if (text === "") {
      errors[field] = t("fieldRequired");
    } else if (!Number.isInteger(value) || value < min || value > max) {
      errors[field] = t("fieldOutOfRange")
        .replace("{min}", String(min))
        .replace("{max}", String(max));
    }
  }

  return errors;
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

const STRUCTURE_LABELS: Record<StructureName, TranslationKeys> = {
  small: "structureSmall",
  medium: "structureMedium",
  large: "structureLarge",
  turbo: "structureTurbo",
};

const getStructureOptions = (t: Translate) =>
  STRUCTURE_NAMES.map((key) => ({ key, label: t(STRUCTURE_LABELS[key]) }));

const getColorOptions = (t: Translate) => [
  { key: "#006FEE", label: t("blue"), color: "#006FEE" },
  { key: "#FF6B6B", label: t("red"), color: "#FF6B6B" },
  { key: "#51CF66", label: t("green"), color: "#51CF66" },
  { key: "#FF922B", label: t("orange"), color: "#FF922B" },
  { key: "#9775FA", label: t("purple"), color: "#9775FA" },
  { key: "#20C997", label: t("turquoise"), color: "#20C997" },
  { key: "#F783AC", label: t("pink"), color: "#F783AC" },
  { key: "#FFD43B", label: t("yellow"), color: "#FFD43B" },
];

export const ConfigForm: React.FC<ConfigFormProps> = ({
  onStart,
  initialConfig,
  savedTournamentLost = false,
}) => {
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

  const [errors, setErrors] = useState<FieldErrors>({});

  const update = (changes: Partial<Draft>) =>
    setDraft((prev) => ({ ...prev, ...changes }));

  // Editar um campo tira o erro dele até a próxima tentativa de iniciar.
  const updateNumber = (field: NumberField, text: string) => {
    update({ [field]: text });
    setErrors(({ [field]: _, ...rest }) => rest);
  };

  // Cada estrutura traz a própria duração e sobrescreve a que estava digitada.
  const handleStructureChange = (name: StructureName) =>
    update({ structure: name, levelDuration: String(structureDuration(name)) });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const found = validateNumbers(draft, t);

    setErrors(found);
    if (Object.keys(found).length > 0) {
      return;
    }

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
          <div className="relative flex items-center justify-center gap-2">
            <Logo color={selectedColor} size={32} />
            <h1 className="text-2xl font-bold">{t("appName")}</h1>
            <div className="absolute right-0">
              <SettingsMenu />
            </div>
          </div>
          <p className="text-center text-muted">
            {t("tournamentConfiguration")}
          </p>
          {savedTournamentLost && (
            <Alert role="status" status="warning">
              <Alert.Indicator />
              <Alert.Content>
                <Alert.Title>{t("savedTournamentLost")}</Alert.Title>
              </Alert.Content>
            </Alert>
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
              {NUMBER_FIELDS.map((field) => (
                <TextField
                  key={field}
                  isRequired
                  isInvalid={Boolean(errors[field])}
                  name={field}
                  type="number"
                  validationBehavior="aria"
                  value={draft[field]}
                  onChange={(text) => updateNumber(field, text)}
                >
                  <Label>{t(field)}</Label>
                  <Input
                    variant="secondary"
                    max={NUMBER_LIMITS[field].max}
                    min={NUMBER_LIMITS[field].min}
                  />
                  <FieldError>{errors[field]}</FieldError>
                </TextField>
              ))}
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
                {t("chooseColorDescription")}
              </p>
            </div>

            <Select
              variant="secondary"
              placeholder={t("selectStructurePlaceholder")}
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
