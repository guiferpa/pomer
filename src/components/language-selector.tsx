import type { Language } from "@/i18n/translations";

import React from "react";
import { Select, SelectItem } from "@heroui/react";

import { useI18n } from "@/hooks";

export const LanguageSelector: React.FC = () => {
  const { language, setLanguage, t } = useI18n();

  const languageOptions = [
    { key: "pt", label: t("portuguese" as any) },
    { key: "es", label: t("spanish" as any) },
    { key: "en", label: t("english" as any) },
  ];

  return (
    <div>
      <label className="block text-sm font-medium mb-2">
        {t("language" as any)}
      </label>
      <Select
        selectedKeys={new Set([language])}
        onSelectionChange={(keys) => {
          const value = Array.from(keys)[0] as string;

          if (value) {
            setLanguage(value as Language);
          }
        }}
      >
        {languageOptions.map((option) => (
          <SelectItem key={option.key}>{option.label}</SelectItem>
        ))}
      </Select>
    </div>
  );
};
