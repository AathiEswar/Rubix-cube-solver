# Rubik's Cube Solver

Scan a real 3x3 cube with your camera, then follow step-by-step moves to solve it.

- **Client:** React + TypeScript + Tailwind (Vite) — fullscreen camera with a 3x3 scan square, live colour detection, rotation guidance, tap-to-fix review.
- **Server:** Express + Node — solves the cube with `cubejs` (Kociemba two-phase algorithm, solutions ~20 moves). On Vercel this runs as a serverless function.

## Setup

```bash
npm install   # workspaces: root + server + client
```

## Run (development)

```bash
npm run dev
```

- Client: http://localhost:5173 (open this)
- API: http://localhost:3535

The server takes a few seconds on first start to build the solver's lookup tables.

> Camera access requires `localhost` or HTTPS. On `localhost` it just works.

## How to use

1. Click **Open camera & start** and allow camera access.
2. Hold the cube **WHITE centre up, GREEN centre facing the camera**, fill the square, press **Scan this face**. Or switch to **Auto capture** (toggle at the top right of the camera screen): when the correct centre colour is showing and the detected colours stay stable for 2 seconds, the face is captured automatically (flash + beep) and the flow advances by itself.
3. Follow the on-screen rotation instructions between faces (rotate left x3, then tilts for white/yellow).
4. After a scan, review the 9 detected colours — tap any wrong sticker to cycle its colour.
5. After all 6 faces, the solution appears one move at a time. Hold the cube **white up, green front** and press **Next step** after each turn.
6. **Reset** any time to start over.

## Move notation

Each move turns one face 90° clockwise *as if you were looking straight at that face* (`'` = counter-clockwise, `2` = 180°). Faces: U=top/white, D=bottom/yellow, F=front/green, B=back/blue, R=right/red, L=left/orange.

## Production build (Node)

```bash
npm run build
npm start   # Express serves the built client at http://localhost:3535
```

## Deploy to Vercel

1. Push this repo to GitHub/GitLab/Bitbucket.
2. In [Vercel](https://vercel.com): **Add New Project** → import the repo.
3. Leave Root Directory as `.` (project root). Settings are already in `vercel.json`:
   - Install: `npm install` (npm workspaces)
   - Build: `npm run vercel-build` (Vite client)
   - Output: `client/dist`
   - API: `api/solve.ts` + `api/health.ts` (serverless; shared solver in `server/src/solver.ts`)
4. Deploy. The site is HTTPS, so the camera works on phones too.

First solve after a cold start can take a few seconds while the Kociemba tables initialise; warm requests are fast.
