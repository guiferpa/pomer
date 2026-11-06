// O page view é enviado uma vez pelo index.html; este módulo só envia os eventos do app.
export const ANALYTICS_EVENTS = [
  "tournament_started",
  "tournament_paused",
  "tournament_resumed",
  "level_skipped",
  "tournament_reset",
] as const;

export type AnalyticsEvent = (typeof ANALYTICS_EVENTS)[number];

export const trackEvent = (event: AnalyticsEvent, label?: string) => {
  window.gtag?.("event", event, {
    event_category: "Tournament",
    event_label: label,
  });
};
