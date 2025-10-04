import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from "react";

import { translations, Language, TranslationKeys } from "./translations";

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
  const [language, setLanguage] = useState<Language>(() => {
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

  // Carregar idioma salvo
  useEffect(() => {
    const savedLang = localStorage.getItem("pomer-language") as Language;

    if (
      savedLang &&
      (savedLang === "pt" || savedLang === "es" || savedLang === "en")
    ) {
      setLanguage(savedLang);
    }
  }, []);

  const t = (key: TranslationKeys): string => {
    return translations[language][key] || translations.pt[key] || key;
  };

  return (
    <I18nContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </I18nContext.Provider>
  );
};

export const useI18n = (): I18nContextType => {
  const context = useContext(I18nContext);

  if (!context) {
    throw new Error("useI18n must be used within an I18nProvider");
  }

  return context;
};
