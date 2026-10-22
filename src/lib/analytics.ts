// Google Analytics (GA4) via the Lovable Google Analytics connector.
//
// Anonymity note: this platform promises anonymous participation, so GA is
// configured with `client_storage: 'none'` — no cookies and no device IDs are
// stored in the visitor's browser. Reports therefore show page paths and
// aggregate traffic, never a persistent per-visitor identity.
const measurementId = import.meta.env.VITE_LOVABLE_CONNECTOR_GOOGLE_ANALYTICS_API_KEY as string | undefined;

declare global {
  interface Window {
    dataLayer: unknown[];
    gtag?: (...args: unknown[]) => void;
  }
}

let initialized = false;

export function initAnalytics() {
  if (initialized || !measurementId) return;
  initialized = true;

  const script = document.createElement('script');
  script.async = true;
  script.src = `https://www.googletagmanager.com/gtag/js?id=${measurementId}`;
  document.head.appendChild(script);

  window.dataLayer = window.dataLayer || [];
  window.gtag = function gtag(..._args: unknown[]) {
    // eslint-disable-next-line prefer-rest-params -- gtag.js needs the Arguments object
    window.dataLayer.push(arguments);
  };
  window.gtag('set', 'developer_id.dZjgwMW', true);
  window.gtag('js', new Date());
  window.gtag('config', measurementId, {
    // Anonymous-friendly configuration: no cookies/localStorage identifiers.
    client_storage: 'none',
    send_page_view: false, // page views are sent explicitly on route changes
  });
}

export function trackPageView(path: string) {
  if (!initialized || !window.gtag || !measurementId) return;
  window.gtag('event', 'page_view', { page_path: path });
}

export function trackEvent(name: string, params?: Record<string, unknown>) {
  if (!initialized || !window.gtag || !measurementId) return;
  window.gtag('event', name, params);
}
