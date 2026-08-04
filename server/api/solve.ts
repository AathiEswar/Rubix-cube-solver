import type { IncomingMessage, ServerResponse } from 'node:http';
import { solveFacelets } from '../src/solver.js';

type VercelReq = IncomingMessage & {
  method?: string;
  body?: any;
};

function sendJson(res: ServerResponse, status: number, data: unknown) {
  if (typeof (res as any).status === 'function' && typeof (res as any).json === 'function') {
    (res as any).status(status).json(data);
    return;
  }
  res.statusCode = status;
  res.setHeader('Content-Type', 'application/json');
  res.end(JSON.stringify(data));
}

async function readBody(req: VercelReq): Promise<{ facelets?: unknown }> {
  if (req.body) {
    if (typeof req.body === 'object') return req.body;
    if (typeof req.body === 'string') {
      try {
        return JSON.parse(req.body);
      } catch {
        return {};
      }
    }
  }
  const chunks: Buffer[] = [];
  try {
    for await (const chunk of req) {
      chunks.push(typeof chunk === 'string' ? Buffer.from(chunk) : chunk);
    }
  } catch {
    return {};
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

export default async function handler(req: VercelReq, res: ServerResponse) {
  try {
    if (req.method === 'OPTIONS') {
      res.statusCode = 204;
      res.end();
      return;
    }
    if (req.method !== 'POST') {
      sendJson(res, 405, { error: 'Method not allowed' });
      return;
    }

    const body = await readBody(req);
    const result = solveFacelets(body.facelets);
    if ('error' in result) {
      sendJson(res, result.status, { error: result.error });
      return;
    }
    sendJson(res, 200, result);
  } catch (err: any) {
    console.error('API /api/solve error:', err);
    sendJson(res, 500, { error: err?.message || 'Internal Server Error' });
  }
}
