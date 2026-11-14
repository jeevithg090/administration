import path from 'node:path';
import { fileURLToPath } from 'node:url';

const serverDir = path.dirname(fileURLToPath(import.meta.url));

export interface ServerConfig {
  port: number;
  /** Root directory for uploads, rendered videos and generated audio. */
  dataDir: string;
  /** Directory containing the built frontend (served in production if present). */
  clientDistDir: string;
  /** Comma-separated list of allowed CORS origins. Empty disables CORS. */
  corsOrigins: string[];
  openRouter: {
    apiKey?: string;
    model: string;
  };
  elevenLabs: {
    apiKey?: string;
    voiceId: string;
    modelId: string;
  };
}

function readOptional(name: string): string | undefined {
  const value = process.env[name]?.trim();
  return value ? value : undefined;
}

export function loadConfig(): ServerConfig {
  const port = Number.parseInt(process.env.PORT ?? '3001', 10);

  return {
    port: Number.isFinite(port) ? port : 3001,
    dataDir: path.resolve(readOptional('DATA_DIR') ?? serverDir),
    clientDistDir: path.resolve(serverDir, '..', 'dist'),
    corsOrigins: (readOptional('CORS_ORIGIN') ?? '')
      .split(',')
      .map((origin) => origin.trim())
      .filter(Boolean),
    openRouter: {
      apiKey: readOptional('OPENROUTER_API_KEY'),
      model: readOptional('OPENROUTER_MODEL') ?? 'meta-llama/llama-3.2-3b-instruct:free',
    },
    elevenLabs: {
      apiKey: readOptional('ELEVENLABS_API_KEY'),
      voiceId: readOptional('ELEVENLABS_VOICE_ID') ?? 'pNInz6obpgDQGcFmaJgB',
      modelId: readOptional('ELEVENLABS_MODEL_ID') ?? 'eleven_multilingual_v2',
    },
  };
}
