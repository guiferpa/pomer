import type { Language } from "@/i18n/translations";

import React from "react";
import { Label, ListBox, Select } from "@heroui/react";

import { useI18n } from "@/hooks";

export const LanguageSelector: React.FC = () => {
  const { language, setLanguage, t } = useI18n();

  const languageOptions = [
    { key: "pt", label: t("portuguese") },
    { key: "es", label: t("spanish") },
    { key: "en", label: t("english") },
  ];

  return (
    <Select
      variant="secondary"
      value={language}
      onChange={(key) => {
        if (key) {
          setLanguage(String(key) as Language);
        }
      }}
    >
      <Label className="block text-sm font-medium mb-2">
        {t("language")}
      </Label>
      <Select.Trigger>
        <Select.Value />
        <Select.Indicator />
      </Select.Trigger>
      <Select.Popover>
        <ListBox>
          {languageOptions.map((option) => (
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
  );
};
