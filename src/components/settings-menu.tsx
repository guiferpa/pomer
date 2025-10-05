import React, { useState } from "react";
import {
  Button,
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  Select,
  SelectItem,
} from "@heroui/react";
import { useTheme } from "@heroui/use-theme";

import { SettingsIcon } from "./icons";

import { useI18n, useAudio } from "@/hooks";

export const SettingsMenu: React.FC = () => {
  const { theme, setTheme } = useTheme();
  const { language, setLanguage, t } = useI18n();
  const { testSound } = useAudio();
  const [isOpen, setIsOpen] = useState(false);

  const themeOptions = [
    { key: "light", label: t("lightMode" as any) },
    { key: "dark", label: t("darkMode" as any) },
  ];

  const languageOptions = [
    { key: "pt", label: t("portuguese" as any) },
    { key: "es", label: t("spanish" as any) },
    { key: "en", label: t("english" as any) },
  ];

  return (
    <>
      <Button
        isIconOnly
        aria-label={t("settings" as any)}
        color="default"
        size="sm"
        onClick={() => setIsOpen(true)}
      >
        <SettingsIcon
          size={16}
          style={{ color: darkenColor("#6B7280", 0.4) }}
        />
      </Button>

      <Modal isOpen={isOpen} size="sm" onOpenChange={setIsOpen}>
        <ModalContent>
          {() => (
            <>
              <ModalHeader className="flex flex-col gap-1">
                {t("settings" as any)}
              </ModalHeader>
              <ModalBody className="pb-6">
                <div className="space-y-6">
                  {/* Tema */}
                  <div className="flex flex-col gap-2">
                    <span className="text-sm font-medium text-foreground">
                      {t("interfaceTheme" as any)}
                    </span>
                    <Select
                      selectedKeys={[theme]}
                      onSelectionChange={(keys) => {
                        const value = Array.from(keys)[0] as string;

                        setTheme(value as "light" | "dark");
                      }}
                    >
                      {themeOptions.map((option) => (
                        <SelectItem key={option.key}>{option.label}</SelectItem>
                      ))}
                    </Select>
                  </div>

                  {/* Idioma */}
                  <div className="flex flex-col gap-2">
                    <span className="text-sm font-medium text-foreground">
                      {t("language" as any)}
                    </span>
                    <Select
                      selectedKeys={[language]}
                      onSelectionChange={(keys) => {
                        const value = Array.from(keys)[0] as string;

                        setLanguage(value as "pt" | "es" | "en");
                      }}
                    >
                      {languageOptions.map((option) => (
                        <SelectItem key={option.key}>{option.label}</SelectItem>
                      ))}
                    </Select>
                  </div>

                  {/* Configurações de Áudio */}
                  <div className="flex flex-col gap-4">
                    <span className="text-sm font-medium text-foreground">
                      {t("soundEffects" as any)}
                    </span>
                    
                    {/* Botão de teste */}
                    <Button
                      size="sm"
                      variant="flat"
                      color="primary"
                      onClick={testSound}
                      className="w-fit"
                    >
                      {t("testSound" as any)}
                    </Button>
                  </div>
                </div>
              </ModalBody>
            </>
          )}
        </ModalContent>
      </Modal>
    </>
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
