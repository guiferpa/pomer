import type { TranslationKeys } from "@/i18n/translations";
import type {
  BlindStructure,
  LevelDraft,
  StructureDraft,
} from "@/types/tournament";

import React, { useState } from "react";
import {
  Button,
  FieldError,
  Fieldset,
  Input,
  Label,
  TextField,
} from "@heroui/react";

import { useI18n } from "@/hooks";
import {
  DURATION_LIMITS,
  LEVEL_FIELDS,
  type LevelError,
  type LevelField,
  type NameError,
  type StructureErrors,
  newStructureId,
  suggestNextLevel,
  validateStructure,
} from "@/utils/structures";

interface StructureEditorProps {
  // O rascunho é controlado por quem usa o editor, que pode guardá-lo.
  draft: StructureDraft;
  onChange: (draft: StructureDraft) => void;
  // As estruturas salvas, para o nome não se repetir.
  saved: BlindStructure[];
  // Recebe a estrutura válida, com id e data de edição, para ser gravada.
  onSave: (structure: BlindStructure) => void;
}

const LEVEL_LABELS: Record<LevelField, TranslationKeys> = {
  smallBlind: "smallBlind",
  bigBlind: "bigBlind",
  ante: "ante",
  duration: "levelDurationShort",
};

const noErrors = (): StructureErrors => ({ levels: [] });

// Edita o nome e os níveis de uma estrutura. Os erros aparecem ao salvar, no
// próprio campo, e somem quando o campo é editado.
export const StructureEditor: React.FC<StructureEditorProps> = ({
  draft,
  onChange,
  saved,
  onSave,
}) => {
  const { t } = useI18n();
  const [errors, setErrors] = useState<StructureErrors>(noErrors);

  const levelMessage = (error: LevelError): string => {
    switch (error) {
      case "required":
        return t("fieldRequired");
      case "notPositiveInteger":
        return t("positiveInteger");
      case "bigBelowSmall":
        return t("bigBelowSmall");
      case "durationOutOfRange":
        return t("fieldOutOfRange")
          .replace("{min}", String(DURATION_LIMITS.min))
          .replace("{max}", String(DURATION_LIMITS.max));
    }
  };

  const nameMessage = (error: NameError): string =>
    error === "required" ? t("fieldRequired") : t("structureNameTaken");

  const setName = (name: string) => {
    onChange({ ...draft, name });
    setErrors(({ name: _, ...rest }) => rest);
  };

  const setLevelField = (index: number, field: LevelField, text: string) => {
    onChange({
      ...draft,
      levels: draft.levels.map((level, i) =>
        i === index ? { ...level, [field]: text } : level,
      ),
    });
    setErrors((prev) => ({
      ...prev,
      levels: prev.levels.map((found, i) => {
        if (i !== index) return found;
        const { [field]: _, ...rest } = found;

        return rest;
      }),
    }));
  };

  const addLevel = () => {
    const last = draft.levels[draft.levels.length - 1];

    onChange({ ...draft, levels: [...draft.levels, suggestNextLevel(last)] });
  };

  const removeLevel = (index: number) => {
    if (draft.levels.length <= 1) return;
    onChange({ ...draft, levels: draft.levels.filter((_, i) => i !== index) });
    setErrors((prev) => ({
      ...prev,
      levels: prev.levels.filter((_, i) => i !== index),
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const result = validateStructure(draft, saved);

    if (!result.ok) {
      setErrors(result.errors);

      return;
    }

    setErrors(noErrors());
    onSave({
      id: draft.id ?? newStructureId(),
      name: result.name,
      levels: result.levels,
      updatedAt: new Date().toISOString(),
    });
  };

  const levelRow = (level: LevelDraft, index: number) => {
    const found = errors.levels[index] ?? {};
    const legend = `${t("level")} ${index + 1}`;

    return (
      <Fieldset
        key={index}
        aria-label={legend}
        className="p-3 rounded-lg bg-surface-secondary"
      >
        <div className="flex items-center justify-between">
          <Fieldset.Legend className="font-medium">{legend}</Fieldset.Legend>
          <Button
            isIconOnly
            aria-label={t("removeLevel").replace("{n}", String(index + 1))}
            isDisabled={draft.levels.length <= 1}
            size="sm"
            variant="danger-soft"
            onPress={() => removeLevel(index)}
          >
            ✕
          </Button>
        </div>
        {/* No celular, 2×2: os blinds em cima, ante e duração embaixo. */}
        <Fieldset.Group className="grid grid-cols-2 gap-2 sm:grid-cols-4">
          {LEVEL_FIELDS.map((field) => (
            <TextField
              key={field}
              isInvalid={Boolean(found[field])}
              name={`${field}-${index}`}
              validationBehavior="aria"
              value={level[field]}
              onChange={(text) => setLevelField(index, field, text)}
            >
              <Label>{t(LEVEL_LABELS[field])}</Label>
              <Input inputMode="numeric" variant="secondary" />
              <FieldError>
                {found[field] ? levelMessage(found[field]) : undefined}
              </FieldError>
            </TextField>
          ))}
        </Fieldset.Group>
      </Fieldset>
    );
  };

  return (
    <form noValidate className="flex flex-col gap-4" onSubmit={handleSubmit}>
      <TextField
        isRequired
        isInvalid={Boolean(errors.name)}
        name="structureName"
        validationBehavior="aria"
        value={draft.name}
        onChange={setName}
      >
        <Label>{t("structureName")}</Label>
        <Input variant="secondary" />
        <FieldError>
          {errors.name ? nameMessage(errors.name) : undefined}
        </FieldError>
      </TextField>

      <div className="flex flex-col gap-3">{draft.levels.map(levelRow)}</div>

      <Button variant="secondary" onPress={addLevel}>
        {t("addLevel")}
      </Button>
      <Button type="submit" variant="primary">
        {t("save")}
      </Button>
    </form>
  );
};
