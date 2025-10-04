import { useEffect } from 'react';

// Google Analytics Measurement ID
// Substitua 'G-XXXXXXXXXX' pelo seu ID real do Google Analytics
const GA_MEASUREMENT_ID = 'G-PMN8PV506L';

export const useAnalytics = () => {
  useEffect(() => {
    // Inicializar Google Analytics
    if (typeof window !== 'undefined' && window.gtag) {
      window.gtag('config', GA_MEASUREMENT_ID, {
        page_title: document.title,
        page_location: window.location.href,
      });
    }
  }, []);

  // Função para rastrear eventos personalizados
  const trackEvent = (action: string, category: string, label?: string, value?: number) => {
    if (typeof window !== 'undefined' && window.gtag) {
      window.gtag('event', action, {
        event_category: category,
        event_label: label,
        value: value,
      });
    }
  };

  // Função para rastrear páginas
  const trackPageView = (page_path: string, page_title?: string) => {
    if (typeof window !== 'undefined' && window.gtag) {
      window.gtag('config', GA_MEASUREMENT_ID, {
        page_path,
        page_title: page_title || document.title,
      });
    }
  };

  return {
    trackEvent,
    trackPageView,
  };
};

// Eventos específicos do Pomer
export const AnalyticsEvents = {
  // Eventos de torneio
  TOURNAMENT_STARTED: 'tournament_started',
  TOURNAMENT_PAUSED: 'tournament_paused',
  TOURNAMENT_RESUMED: 'tournament_resumed',
  TOURNAMENT_RESET: 'tournament_reset',
  LEVEL_COMPLETED: 'level_completed',
  LEVEL_SKIPPED: 'level_skipped',
  
  // Eventos de configuração
  CONFIG_SAVED: 'config_saved',
  COLOR_CHANGED: 'color_changed',
  THEME_CHANGED: 'theme_changed',
  LANGUAGE_CHANGED: 'language_changed',
  STRUCTURE_CHANGED: 'structure_changed',
  
  // Eventos de UI
  SETTINGS_OPENED: 'settings_opened',
  HISTORY_VIEWED: 'history_viewed',
} as const;

export type AnalyticsEvent = typeof AnalyticsEvents[keyof typeof AnalyticsEvents];
