/// <reference types="vite/client" />

// Injected by wind-ui server.ts at serve time (window.__WIND_MODE__ = 'mock' | 'live')
// so the client's default mode always matches the running server, regardless of
// whether the bundle was built with VITE_WIND_MODE=mock or live baked in.
interface Window {
  __WIND_MODE__?: string;
}
