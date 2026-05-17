// Centralized config — all env vars in one place
// This makes it easy to audit what is exposed

const config = {
  trackingWebhook: import.meta.env.VITE_TRACKING_WEBHOOK as string,
  trackingToken: import.meta.env.VITE_TRACKING_TOKEN as string,
  isDev: import.meta.env.DEV,
  isProd: import.meta.env.PROD,
};

// Warn in development if env vars are missing
if (config.isDev) {
  if (!config.trackingWebhook) {
    console.warn('VioletCare: VITE_TRACKING_WEBHOOK not set');
  }
  if (!config.trackingToken) {
    console.warn('VioletCare: VITE_TRACKING_TOKEN not set');
  }
}

// In production: fail silently, never log secrets
export default config;
