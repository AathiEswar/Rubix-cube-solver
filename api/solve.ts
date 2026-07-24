import type { IncomingMessage, ServerResponse } from 'node:http';
import { solveFacelets } from '../server/src/solver';

/**
 * Vercel serverless handler for POST /api/solve.
 * Initialises the Kociemba tables once per warm instance (via solveFacelets).
 */

type VercelReq = IncomingMessage & {
  method?: string;
  body?: { facelets?: unknown };
};

type VercelRes = ServerResponse & {
  status: (code: number) => VercelRes;
  json: (body: unknown) => void;
};

async function readBody(req: VercelReq): Promise<{ facelets?: unknown }> {
  if (req.body && typeof req.body === 'object') return req.body;
  const chunks: Buffer[] = [];
  for await (const chunk of req) {
    chunks.push(typeof chunk === 'string' ? Buffer.from(chunk) : chunk);
  }
  if (chunks.length === 0) return {};
  try {
    return JSON.parse(Buffer.concat(chunks).toString('utf8')) as {
      facelets?: unknown;
    };
  } catch {
    return {};
  }
}

export default async function handler(req: VercelReq, res: VercelRes) {
  if (req.method === 'OPTIONS') {
    res.status(204).end();
    return;
  }
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  const body = await readBody(req);
  const result = solveFacelets(body.facelets);
  if ('error' in result) {
    res.status(result.status).json({ error: result.error });
    return;
  }
  res.status(200).json(result);
}
