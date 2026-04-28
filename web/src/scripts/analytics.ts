type GtagArgs = [
  command: 'event' | 'config' | 'set' | 'js',
  ...rest: unknown[]
];

declare global {
  interface Window {
    gtag?: (...args: GtagArgs) => void;
    dataLayer?: unknown[];
  }
}

export type AnalyticsEvent =
  | 'signup_attempt'
  | 'signup_complete'
  | 'signup_error'
  | 'pdf_link_click';

export function track(event: AnalyticsEvent, params: Record<string, unknown> = {}): void {
  if (typeof window === 'undefined') return;
  if (typeof window.gtag !== 'function') return;
  window.gtag('event', event, params);
}
