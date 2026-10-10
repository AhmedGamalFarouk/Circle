// Login used by the "Skip Authentication" buttons. It is a dedicated demo
// account with its own data, so shipping these credentials in the bundle is
// fine. Override them with VITE_DEMO_EMAIL / VITE_DEMO_PASSWORD.
export const DEMO_EMAIL =
  import.meta.env.VITE_DEMO_EMAIL || "demo@circle-26a87.firebaseapp.com";
export const DEMO_PASSWORD = import.meta.env.VITE_DEMO_PASSWORD || "Demo-F_KpNGPuk_9P";
