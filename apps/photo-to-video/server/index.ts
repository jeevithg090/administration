import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

// Load ../.env (if present) before reading configuration.
const envFile = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '.env');
if (fs.existsSync(envFile)) process.loadEnvFile(envFile);

const { loadConfig } = await import('./config.ts');
const { createApp } = await import('./app.ts');
const { createAiServices } = await import('./lib/ai.ts');

const config = loadConfig();
const app = createApp({
  dataDir: config.dataDir,
  ai: createAiServices(config),
  corsOrigins: config.corsOrigins,
  clientDistDir: config.clientDistDir,
  features: { narration: Boolean(config.openRouter.apiKey && config.elevenLabs.apiKey) },
});

app.listen(config.port, () => {
  console.log(`Photo-to-video server listening on http://localhost:${config.port}`);
  if (!config.openRouter.apiKey)
    console.warn('OPENROUTER_API_KEY not set: AI script generation disabled.');
  if (!config.elevenLabs.apiKey) console.warn('ELEVENLABS_API_KEY not set: AI narration disabled.');
});
