// @vitest-environment happy-dom
// LAC contract test template (architect thread 83d2fd5c, rule 5).
// Copy across UI apps; adjust only the service under test + VITE_ key.
//
// Acceptance mechanism for the Live-Authoritative Contract:
//   - boot the API service in LIVE mode with a FAILING transport
//   - assert the failure SURFACES as a rejected promise (fail-visible)
//   - assert ZERO fixture/mock data paths executed (fixture sentinel
//     never invoked)

import { describe, it, expect, vi, beforeEach } from 'vitest';

const fixtureSentinel = vi.fn(() => {
  throw new Error('LAC VIOLATION: fixture path executed in live mode');
});

vi.mock('./mockBackend', () => ({
  mockBackend: new Proxy({}, {
    get(_t, _prop) {
      return (...args: unknown[]) => fixtureSentinel();
    },
  }),
}));

describe('LAC contract: wind-ui ApiService', () => {
  beforeEach(() => {
    vi.resetModules();
    fixtureSentinel.mockClear();
    // Hermetic mode resolution: vite.config.ts test.env pins
    // VITE_WIND_MODE='' so a local .env cannot flip the app into mock.
    // LIVE transport that always fails.
    vi.stubGlobal('fetch', vi.fn(async () => {
      throw new TypeError('simulate network failure');
    }));
    localStorage.clear();
  });

  it('defaults to LIVE mode when VITE_WIND_MODE is not mock (no implicit mock)', async () => {
    const mod = await import('./api');
    expect(mod.apiService.getMode()).toBe('LIVE');
  });

  it('surfaces live-transport failures instead of falling back to fixtures', async () => {
    const mod = await import('./api');
    await expect(mod.apiService.getHealth()).rejects.toThrow(/simulate network failure/);
    expect(fixtureSentinel).not.toHaveBeenCalled();
  });

  it('never restores mode from localStorage', async () => {
    localStorage.setItem('wind_api_mode', 'MOCK');
    const mod = await import('./api');
    expect(mod.apiService.getMode()).toBe('LIVE');
  });
});
