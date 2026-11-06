import React from "react";
import { Button, Label, ListBox, Modal, Select, useTheme } from "@heroui/react";

import { SettingsIcon } from "./icons";

import { useI18n, useAudio } from "@/hooks";

export const SettingsMenu: React.FC = () => {
  const { resolvedTheme, setTheme } = useTheme();
  const { language, setLanguage, t } = useI18n();
  const { testSound } = useAudio();

  const themeOptions = [
    { key: "light", label: t("lightMode") },
    { key: "dark", label: t("darkMode") },
  ];

  const languageOptions = [
    { key: "pt", label: t("portuguese") },
    { key: "es", label: t("spanish") },
    { key: "en", label: t("english") },
  ];

  return (
    <Modal>
      <Button
        isIconOnly
        aria-label={t("settings")}
        size="sm"
        variant="tertiary"
      >
        <SettingsIcon
          size={16}
          style={{ color: darkenColor("#6B7280", 0.4) }}
        />
      </Button>

      <Modal.Backdrop>
        <Modal.Container size="sm">
          <Modal.Dialog>
            <Modal.CloseTrigger />
            <Modal.Header>
              <Modal.Heading>{t("settings")}</Modal.Heading>
            </Modal.Header>
            <Modal.Body className="pb-6">
              <div className="space-y-6">
                {/* Tema */}
                <Select
                  variant="secondary"
                  className="flex flex-col gap-2"
                  value={resolvedTheme}
                  onChange={(key) => {
                    if (key) {
                      setTheme(String(key));
                    }
                  }}
                >
                  <Label className="text-sm font-medium text-foreground">
                    {t("interfaceTheme")}
                  </Label>
                  <Select.Trigger>
                    <Select.Value />
                    <Select.Indicator />
                  </Select.Trigger>
                  <Select.Popover>
                    <ListBox>
                      {themeOptions.map((option) => (
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

                {/* Idioma */}
                <Select
                  variant="secondary"
                  className="flex flex-col gap-2"
                  value={language}
                  onChange={(key) => {
                    if (key) {
                      setLanguage(String(key) as "pt" | "es" | "en");
                    }
                  }}
                >
                  <Label className="text-sm font-medium text-foreground">
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

                {/* Configurações de Áudio */}
                <div className="flex flex-col gap-4">
                  <span className="text-sm font-medium text-foreground">
                    {t("soundEffects")}
                  </span>

                  {/* Botão de teste */}
                  <Button
                    className="w-fit"
                    size="sm"
                    variant="tertiary"
                    onPress={testSound}
                  >
                    {t("testSound")}
                  </Button>
                </div>
              </div>
            </Modal.Body>
          </Modal.Dialog>
        </Modal.Container>
      </Modal.Backdrop>
    </Modal>
  );
};

// Função para escurecer uma cor (copiada do Countdown)
const darkenColor = (color: string, amount: number = 0.3): string => {
  const hex = color.replace("#", "");
  const r = parseInt(hex.substr(0, 2), 16);
  const g = parseInt(hex.substr(2, 2), 16);
  const b = parseInt(hex.substr(4, 2), 16);

  const newR = Math.floor(r * (1 - amount));
  const newG = Math.floor(g * (1 - amount));
  const newB = Math.floor(b * (1 - amount));

  return `#${newR.toString(16).padStart(2, "0")}${newG.toString(16).padStart(2, "0")}${newB.toString(16).padStart(2, "0")}`;
};
