import { createApp } from './app.js';

/**
 * Local / traditional Node entry: create the Express app and listen.
 * On Vercel, api/index.ts exports the app instead.
 */

const app = createApp();
const PORT = Number(process.env.PORT) || 3535;
app.listen(PORT, () => {
  console.log(`Cube solver API listening on http://localhost:${PORT}`);
});
