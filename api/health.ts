import type { IncomingMessage, ServerResponse } from 'node:http';
import { ensureSolverReady, isSolverReady } from '../server/src/solver';

/**
 * Vercel serverless handler for GET /api/health.
 */

function sendJson(res: ServerResponse, status: number, data: unknown) {
  if (typeof (res as any).status === 'function' && typeof (res as any).json === 'function') {
    (res as any).status(status).json(data);
    return;
  }
  res.statusCode = status;
  res.setHeader('Content-Type', 'application/json');
  res.end(JSON.stringify(data));
}

export default function handler(_req: IncomingMessage, res: ServerResponse) {
  try {
    ensureSolverReady();
    sendJson(res, 200, { ok: true, solverReady: isSolverReady() });
  } catch (err: any) {
    sendJson(res, 503, { ok: false, solverReady: false, error: err?.message });
  }
}

