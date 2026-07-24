import type { IncomingMessage, ServerResponse } from 'node:http';
import { ensureSolverReady, isSolverReady } from '../server/src/solver';

/**
 * Vercel serverless handler for GET /api/health.
 */

type Res = ServerResponse & {
  status: (code: number) => Res;
  json: (body: unknown) => void;
};

export default function handler(_req: IncomingMessage, res: Res) {
  try {
    ensureSolverReady();
  } catch {
    res.status(503).json({ ok: false, solverReady: false });
    return;
  }
  res.status(200).json({ ok: true, solverReady: isSolverReady() });
}
