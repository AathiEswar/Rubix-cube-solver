import express from 'express';
import cors from 'cors';
import path from 'node:path';
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';
import { ensureSolverReady, isSolverReady, solveFacelets } from './solver.js';

/**
 * Express app (no listen): used by the local Node process and by the Vercel
 * serverless entry. Static client serving is skipped on Vercel.
 */

export function createApp() {
  const app = express();
  app.use(cors());
  app.use(express.json({ limit: '32kb' }));

  // Build solver tables once at process start (cold start on serverless).
  console.log('Initialising Kociemba solver (this takes a few seconds)...');
  ensureSolverReady();
  console.log('Solver ready.');

  app.get('/api/health', (_req, res) => {
    res.json({ ok: true, solverReady: isSolverReady() });
  });

  app.post('/api/solve', (req, res) => {
    const facelets = (req.body ?? {}).facelets;
    const result = solveFacelets(facelets);
    if ('error' in result) {
      res.status(result.status).json({ error: result.error });
      return;
    }
    res.json(result);
  });

  // Serve the built client in local/production Node deploys (not on Vercel —
  // the CDN serves client/dist there).
  if (!process.env.VERCEL) {
    const clientDist = path.resolve(
      path.dirname(fileURLToPath(import.meta.url)),
      '../../client/dist'
    );
    if (fs.existsSync(clientDist)) {
      app.use(express.static(clientDist));
      app.get('*', (_req, res) =>
        res.sendFile(path.join(clientDist, 'index.html'))
      );
    }
  }

  return app;
}
