import express, { Request, Response, NextFunction } from 'express';
import path from 'path';
import { readFileSync } from 'fs';
import { createServer as createViteServer } from 'vite';
import dotenv from 'dotenv';
import http from 'http';

dotenv.config();

// wind-ui mode flag (same routine as tackle-ui):
//   VITE_WIND_MODE=mock  -> serves the SPA on :3000 (client-side mockBackend handles data)
//   VITE_WIND_MODE=live  -> serves on :4209 and proxies to the two real backends:
//     /api/* + /health            -> wind-srv   (nexus.wind schema)
//     /config/ai/*, /tasks, /sessions, /scheduler, /memory/*, /prompts/* -> tackle-srv
const WIND_MODE = (process.env.VITE_WIND_MODE || 'mock').toLowerCase();
const WIND_SRV_TARGET = process.env.VITE_WIND_SRV_TARGET || 'http://localhost:3300';
const TACKLE_SRV_TARGET = process.env.VITE_TACKLE_SRV_TARGET || 'http://localhost:3410';

// Inject the runtime mode into the served HTML so the client's default mode
// always matches the server (import.meta.env.VITE_WIND_MODE is baked at build
// time and would otherwise go stale in the static-dist prod path). The explicit
// BrandingBox localStorage toggle still wins in the client.
function injectWindMode(html: string): string {
  return html.replace(
    '</head>',
    `<script>window.__WIND_MODE__ = ${JSON.stringify(WIND_MODE)};</script></head>`
  );
}

function createLiveProxy(targetUrl: string) {
  const url = new URL(targetUrl);
  return (req: Request, res: Response, next: NextFunction) => {
    if (req.path.startsWith('/@') || req.path.startsWith('/src') ||
        req.path.startsWith('/node_modules') || req.path.startsWith('/favicon') ||
        req.path === '/') {
      return next();
    }
    console.log(`[wind-ui -> live] ${req.method} ${req.path} -> ${targetUrl}`);
    const rawBody = ['POST', 'PUT', 'PATCH'].includes(req.method) && req.body
      ? JSON.stringify(req.body) : undefined;
    const body = rawBody && rawBody !== '{}' ? rawBody : undefined;
    const headers: Record<string, any> = { ...req.headers, host: `${url.hostname}:${url.port}` };
    delete headers['content-length'];
    if (body) headers['content-length'] = Buffer.byteLength(body).toString();
    const proxyReq = http.request({
      hostname: url.hostname, port: url.port,
      path: req.originalUrl || req.url, method: req.method, headers,
    }, (proxyRes) => {
      res.writeHead(proxyRes.statusCode || 502, proxyRes.headers);
      proxyRes.pipe(res);
    });
    proxyReq.on('error', (err) => {
      console.error(`[wind-ui -> live] proxy error: ${err.message}`);
      if (!res.headersSent) res.status(502).json({ error: 'Backend unreachable', detail: err.message });
    });
    proxyReq.setTimeout(30000, () => { proxyReq.destroy(); });
    if (body) proxyReq.write(body);
    proxyReq.end();
  };
}

async function startServer() {
  const app = express();
  // Port selection by mode: mock → 3000, live → 4209 (override with PORT env var)
  const PORT = WIND_MODE === 'live'
    ? parseInt(process.env.PORT || '4209', 10)
    : parseInt(process.env.PORT || '3000', 10);

  app.use(express.json());

  // Log requests
  app.use((req, res, next) => {
    if (!req.path.startsWith('/@') && !req.path.startsWith('/src') && !req.path.startsWith('/node_modules') && !req.path.startsWith('/favicon')) {
      console.log(`[wind-ui] ${req.method} ${req.path}`);
    }
    next();
  });

  if (WIND_MODE === 'live') {
    console.log(`[wind-ui] LIVE mode - proxying /api/* + /health -> ${WIND_SRV_TARGET}, rest -> ${TACKLE_SRV_TARGET}`);

    // --- LIVE-MODE FALLBACK STUBS ---
    // Endpoints the wind-ui client calls that neither backend serves, registered
    // BEFORE the catch-all proxy so the UI doesn't break (same pattern as tackle-ui).
    // wind-ui calls /api/mcp/memory/role-updates for role checkpoints; neither
    // wind-srv nor tackle-srv serves that path — return an empty map so
    // TackleManager's Promise.all resolves instead of failing the whole tab.
    app.get('/api/mcp/memory/role-updates', (req: Request, res: Response) => {
      res.json({});
    });

    // Catch-all proxy: route by path prefix to the owning backend.
    const windProxy = createLiveProxy(WIND_SRV_TARGET);
    const tackleProxy = createLiveProxy(TACKLE_SRV_TARGET);
    app.use((req: Request, res: Response, next: NextFunction) => {
      const proxy = (req.path === '/health' || req.path.startsWith('/api/')) ? windProxy : tackleProxy;
      proxy(req, res, next);
    });
  }

  // Mount Vite or static server
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
      plugins: [{
        name: 'wind-ui-inject-mode',
        transformIndexHtml(html: string) {
          return injectWindMode(html);
        }
      }]
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    // index:false so GET / falls through to the injecting fallback below —
    // otherwise express.static serves dist/index.html raw and the
    // window.__WIND_MODE__ injection never runs in the prod path.
    app.use(express.static(distPath, { index: false }));
    app.get('*', (req: Request, res: Response) => {
      try {
        const html = readFileSync(path.join(distPath, 'index.html'), 'utf8');
        res.send(injectWindMode(html));
      } catch {
        res.sendFile(path.join(distPath, 'index.html'));
      }
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`[wind-ui] ${WIND_MODE.toUpperCase()} mode running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
