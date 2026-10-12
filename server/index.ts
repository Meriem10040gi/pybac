// Starts the Node server: the API, and in production the built site (dist/).
// Used on your computer (npm run dev, npm start) and on hosts like Render. On Vercel, the API runs
// as a function instead (api/index.ts).
import { parseArgs } from 'node:util';

import { createApp } from './app.js';
import { configFromEnv } from './config.js';

let app;
try {
  app = createApp(await configFromEnv());
} catch (e) {
  console.error(e instanceof Error ? e.message : e);
  process.exit(1);
}

// --port (development: always 3000, the port the site forwards /api to), else PORT (given by the host)
const { values: args } = parseArgs({ options: { port: { type: 'string' } } });
const port = Number(args.port ?? process.env.PORT ?? 3000);
app.listen(port, () => console.log(`[server] http://localhost:${port}`));
