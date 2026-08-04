# Rubik's Cube Solver (Independent Apps)

This repository contains two completely independent applications:

1. **`client/`**: React + Vite + Tailwind CSS camera scanner frontend.
2. **`server/`**: Express + TypeScript Kociemba solver API backend (with optional Vercel serverless handlers in `server/api/`).

---

## 🚀 Independent Local Development

### 1. Backend Server (`server/`)
```bash
cd server
npm install
npm run dev
```
Server runs at `http://localhost:3535`.

### 2. Frontend Client (`client/`)
```bash
cd client
npm install
npm run dev
```
Client runs at `http://localhost:5173`.

---

## 🌐 Independent Deployments

- **Deploy Frontend (`client/`)**: Deploy the `client/` folder to Vercel, Netlify, or Cloudflare Pages. Set `VITE_API_BASE_URL` to your backend URL.
- **Deploy Backend (`server/`)**: Deploy the `server/` folder to Render, Railway, Fly.io, or Vercel. Set `CLIENT_ORIGIN` to your frontend URL.
