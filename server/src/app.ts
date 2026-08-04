import express from 'express';
import cors from 'cors';
import { ensureSolverReady, isSolverReady, solveFacelets } from './solver.js';

/**
 * Standalone Express app for Rubik's Cube Solver API.
 */

export function createApp() {
  const app = express();
  const clientOrigin = process.env.CLIENT_ORIGIN || '*';
  app.use(
    cors({
      origin: clientOrigin === '*' ? '*' : clientOrigin.replace(/\/$/, ''),
      methods: ['GET', 'POST', 'OPTIONS'],
      allowedHeaders: ['Content-Type'],
    })
  );
  app.use(express.json({ limit: '32kb' }));

  // Build solver tables once at process start.
  console.log('Initialising Kociemba solver...');
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

  return app;
}
