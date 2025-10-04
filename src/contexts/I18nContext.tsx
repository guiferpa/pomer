import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from "react";

import { translations, Language, TranslationKeys } from "@/i18n/translations";

interface I18nContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: TranslationKeys) => string;
}

const I18nContext = createContext<I18nContextType | undefined>(undefined);

interface I18nProviderProps {
  children: ReactNode;
}

export const I18nProvider: React.FC<I18nProviderProps> = ({ children }) => {
  const [language, setLanguageState] = useState<Language>(() => {
    // Carregar idioma salvo
    const savedLang = localStorage.getItem("pomer-language") as Language;

    if (
      savedLang &&
      (savedLang === "pt" || savedLang === "es" || savedLang === "en")
    ) {
      return savedLang;
    }

    // Detectar idioma do navegador
    const browserLang = navigator.language.split("-")[0];

    if (browserLang === "pt" || browserLang === "es" || browserLang === "en") {
      return browserLang as Language;
    }

    return "pt"; // Default para português
  });

  // Salvar idioma no localStorage
  useEffect(() => {
    localStorage.setItem("pomer-language", language);
  }, [language]);

  const setLanguage = (lang: Language) => {
    if (lang !== language) {
      setLanguageState(lang);
    }
  };

  const t = (key: TranslationKeys): string => {
    const currentTranslations = translations[language];
    const fallbackTranslations = translations.pt;

    if (currentTranslations && currentTranslations[key]) {
      return currentTranslations[key];
    }

    if (fallbackTranslations && fallbackTranslations[key]) {
      return fallbackTranslations[key];
    }

    return key as string;
  };

  return (
    <I18nContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </I18nContext.Provider>
  );
};

export const useI18n = (): I18nContextType => {
  const context = useContext(I18nContext);

  if (context === undefined) {
    throw new Error("useI18n must be used within an I18nProvider");
  }

  return context;
};
