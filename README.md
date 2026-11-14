# Administration Tools

Two self-contained web tools for an institution's marketing and media team, kept in one
npm-workspaces monorepo:

| App                                                       | What it does                                                                                                                                                                  |
| --------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| [**Marketing Post Generator**](#marketing-post-generator) | Builds branded festival greetings, advertisements and announcements in every common social-media format, rendered locally or with an AI image model, with your logo overlaid. |
| [**Photo to Video Converter**](#photo-to-video-converter) | Turns a set of photos into an MP4 slideshow with cross-fades, then optionally adds background music or an AI-written, AI-voiced narration.                                    |

Both are React 19 + TypeScript + Vite frontends. The photo-to-video app also has an Express 5
API that drives FFmpeg.

---

## Contents

- [Quick start](#quick-start)
- [Marketing Post Generator](#marketing-post-generator)
- [Photo to Video Converter](#photo-to-video-converter)
- [Environment variables](#environment-variables)
- [Scripts](#scripts)
- [Testing](#testing)
- [Deployment](#deployment)
- [Project structure](#project-structure)

## Quick start

**Requirements:** Node.js 20.12+ (22 recommended, see `.nvmrc`) and, for the video app,
[FFmpeg](https://ffmpeg.org/download.html) on your `PATH` (`brew install ffmpeg`,
`sudo apt install ffmpeg`, …).

```bash
npm install                      # installs both apps (npm workspaces)

# Optional: API keys for the AI features (both apps work without them)
cp apps/marketing-tool/.env.example apps/marketing-tool/.env
cp apps/photo-to-video/.env.example apps/photo-to-video/.env

npm run dev:marketing            # http://localhost:5173
npm run dev:video                # http://localhost:5173 (web) + http://localhost:3001 (API)
```

Run one app at a time, or start the second one with `-- --port 5174`.

---

## Marketing Post Generator

`apps/marketing-tool`

### Features

- **Three post types:** festival/event greetings (20 Indian festivals with colour palettes and
  cultural keywords, searchable and filterable by category), advertisements and announcements.
- **Five output formats in one go:** Square 1:1, Landscape 16:9, Stories 9:16, Portrait 4:5 and
  Banner 2:1, each rendered at its native pixel size.
- **Local renderer (default, no keys needed):** draws the post on a canvas with the festival's
  palette, automatically chosen high-contrast text, word-wrapped headline and subtitle, and
  festival motifs (diyas, rangoli, mandala, crescent moon, confetti). Falls back to SVG if canvas
  is unavailable.
- **AI models (optional):** a text model on OpenRouter first writes a detailed art-direction
  prompt, then an image model (Gemini 2.5 Flash Image via OpenRouter, or Stable Diffusion XL via
  Hugging Face) generates the artwork, which is cropped to the exact format.
- **Logo overlay:** an uploaded logo is composited onto every post, AI or local.
- **Graceful degradation:** if an AI call fails for a format (missing key, rate limit, outage),
  that post is rendered locally and the UI says which model failed and why.
- **No secrets in the browser:** the frontend calls `/api/openrouter/*` and
  `/api/huggingface/*`; a server-side proxy adds the API keys.

### How it works

```
 Form state (App.tsx)
        │  PostRequest { postType, festival?, customText?, brandName }
        ▼
 lib/generate.ts ──► local model ──► lib/postContent.ts (text, palette, motifs)
        │                               └► lib/canvas.ts  (canvas → PNG, logo)
        │
        └────────► AI model ──► lib/prompts.ts → lib/ai.ts ──► /api/openrouter/chat/completions
                                                     │       └► /api/huggingface/models/<id>
                                                     ▼
                                       lib/canvas.ts finalizeImage (crop + logo)
                                       (any failure → local render + reason)

 /api/* ──► Vite dev/preview proxy (vite.config.ts) adds `Authorization: Bearer <key>`
```

Keys are read from **non-`VITE_`** environment variables, so Vite never bundles them. Providers
without a key are not proxied at all; requests get a local 404 and the app falls back.

---

## Photo to Video Converter

`apps/photo-to-video`

### Features

- **Upload** up to 20 JPG/PNG/GIF/WebP images (10 MB each) by drag-and-drop or file picker,
  with thumbnails and per-file removal.
- **Render** an H.264 MP4 at 720p or 1080p. Each image is letter-boxed to the frame and shown
  for 0.5–10 s, with optional 0.5 s cross-fades (FFmpeg `xfade`). Progress is reported from
  FFmpeg's own output.
- **Background music:** upload an MP3/WAV/OGG/M4A/AAC track; it loops if shorter than the video.
- **AI narration:** describe the slideshow, OpenRouter writes a 30–60 s script, ElevenLabs reads
  it, and the voice-over is muxed into the video.
- **Preview and download** in the browser (range requests, so seeking works).
- **No FFmpeg on the server?** The UI offers an in-browser fallback that records the slideshow
  from a canvas with `MediaRecorder` and downloads a WebM.

### How it works

```
 React UI ──► POST /api/upload              multer → server/uploads/<uuid>.<ext>
          ──► POST /api/create-video        validate → job → ffmpeg (xfade/concat) → server/videos/<job>.mp4
          ──► GET  /api/video-status/:id    poll { status, progress, error }
          ──► POST /api/add-background-music  ffprobe (has audio?) → ffmpeg mix → new job
          ──► POST /api/generate-script     OpenRouter chat completion
          ──► POST /api/generate-audio      ElevenLabs TTS → server/audio/<job>.mp3 (job)
          ──► POST /api/mix-ai-audio        ffmpeg mux → new job
          ──► GET  /api/preview/:id | /api/download/:id
```

- `server/app.ts` — `createApp()` builds the Express app (injectable AI services and FFmpeg
  runner, which keeps it testable). `server/index.ts` loads `.env`, then listens.
- `server/lib/validation.ts` — strict request parsing. Client-supplied file references must match
  the server's `<uuid>.<ext>` naming, which rules out path traversal.
- `server/lib/ffmpeg.ts` — pure argument builders plus a small `spawn` wrapper (no shell).
- `server/lib/jobs.ts` — in-memory job store. Jobs are lost on restart.
- In development Vite proxies `/api` and `/uploads` to the API. In production Express serves the
  built frontend from `dist/`, so everything is same-origin.

### API

| Method | Path                        | Body                                                        | Response                                        |
| ------ | --------------------------- | ----------------------------------------------------------- | ----------------------------------------------- |
| GET    | `/api/health`               | –                                                           | `{ status: "ok" }`                              |
| POST   | `/api/upload`               | multipart `images[]`                                        | `{ files: [{ filename, originalName, size }] }` |
| POST   | `/api/create-video`         | `{ imageFiles, duration?, useTransitions?, videoQuality? }` | `202 { jobId }`                                 |
| GET    | `/api/video-status/:jobId`  | –                                                           | `{ id, status, progress, error? }`              |
| GET    | `/api/preview/:jobId`       | –                                                           | `video/mp4` (Range support)                     |
| GET    | `/api/download/:jobId`      | –                                                           | MP4 attachment                                  |
| POST   | `/api/add-background-music` | multipart `music`, `videoJobId`                             | `202 { jobId }`                                 |
| POST   | `/api/generate-script`      | `{ videoJobId, videoDescription }`                          | `{ script }`                                    |
| POST   | `/api/generate-audio`       | `{ videoJobId, script }`                                    | `202 { audioJobId }`                            |
| GET    | `/api/audio-status/:jobId`  | –                                                           | `{ id, status, progress, script, error? }`      |
| POST   | `/api/mix-ai-audio`         | `{ videoJobId, audioJobId }`                                | `202 { jobId }`                                 |

Errors are JSON `{ error }` with `400` (validation), `404` (unknown job/route) or `503` (AI key
not configured).

---

## Environment variables

Copy each app's `.env.example` to `.env`. **Never commit `.env` files** (they are git-ignored).

### `apps/marketing-tool/.env`

| Variable               | Side   | Default                                      | Purpose                                    |
| ---------------------- | ------ | -------------------------------------------- | ------------------------------------------ |
| `OPENROUTER_API_KEY`   | server | –                                            | Prompt writing and the Gemini image model  |
| `HUGGINGFACE_API_KEY`  | server | –                                            | Stable Diffusion XL                        |
| `HUGGINGFACE_BASE_URL` | server | `https://router.huggingface.co/hf-inference` | Hugging Face inference endpoint            |
| `VITE_BRAND_NAME`      | client | `ICAS Manipal`                               | Name shown on posts and used in prompts    |
| `VITE_AI_PROXY_BASE`   | client | `/api`                                       | Where the frontend sends AI requests       |
| `VITE_PROMPT_MODEL`    | client | `anthropic/claude-3.5-sonnet`                | OpenRouter model that writes image prompts |

"Server" variables are only read by the Vite proxy (`npm run dev` / `npm run preview`).
`VITE_*` variables are compiled into the public bundle, so never put secrets in them.

### `apps/photo-to-video/.env`

| Variable              | Default                                 | Purpose                                                           |
| --------------------- | --------------------------------------- | ----------------------------------------------------------------- |
| `PORT`                | `3001`                                  | API (and production web) port                                     |
| `DATA_DIR`            | `apps/photo-to-video/server`            | Root for `uploads/`, `videos/` and `audio/`                       |
| `CORS_ORIGIN`         | – (CORS off)                            | Comma-separated origins, only if the frontend is hosted elsewhere |
| `OPENROUTER_API_KEY`  | –                                       | Narration script generation                                       |
| `OPENROUTER_MODEL`    | `meta-llama/llama-3.2-3b-instruct:free` | Script model                                                      |
| `ELEVENLABS_API_KEY`  | –                                       | Text-to-speech                                                    |
| `ELEVENLABS_VOICE_ID` | `pNInz6obpgDQGcFmaJgB`                  | Voice                                                             |
| `ELEVENLABS_MODEL_ID` | `eleven_multilingual_v2`                | TTS model                                                         |
| `VITE_API_URL`        | – (same origin)                         | Build-time: API URL if it is on another origin                    |

## Scripts

Run from the repository root:

| Command                 | Description                                             |
| ----------------------- | ------------------------------------------------------- |
| `npm run dev:marketing` | Marketing tool dev server                               |
| `npm run dev:video`     | Photo-to-video web + API with reload                    |
| `npm run build`         | Type-check and build both apps                          |
| `npm run lint`          | ESLint (typescript-eslint, React Hooks rules)           |
| `npm run typecheck`     | `tsc -b` for frontends, server and configs              |
| `npm test`              | Vitest suites for both apps                             |
| `npm run format`        | Prettier                                                |
| `npm run check`         | Format check, lint, tests and build: run before pushing |

Per-app scripts can be run with `-w`, e.g. `npm start -w photo-to-video`.

## Testing

```bash
npm test
```

- **marketing-tool:** post content and colour-contrast logic, word wrapping, SVG escaping,
  prompt templates, AI client behaviour with a mocked `fetch` (including the guarantee that the
  browser never sends an `Authorization` header) and the generation pipeline's per-image
  fallback.
- **photo-to-video:** request validation (including path traversal), FFmpeg argument builders,
  HTTP routes via Supertest, and **real FFmpeg integration tests** that render a cross-faded
  slideshow, add looping music, serve it with Range requests and run the full narration flow
  with stubbed AI services. Integration suites are skipped automatically when `ffmpeg` is not
  installed.

## Deployment

### Photo to Video Converter

One Node process serves both the API and the built frontend:

```bash
npm ci
npm run build -w photo-to-video
PORT=3001 DATA_DIR=/var/lib/photo-to-video npm start -w photo-to-video
```

The host needs FFmpeg (and `ffprobe`). Put it behind a reverse proxy with TLS, and give
`DATA_DIR` persistent storage. Before exposing it publicly, see the follow-ups below
(authentication, rate limiting, file cleanup).

### Marketing Post Generator

`npm run build -w marketing-tool` produces static files in `apps/marketing-tool/dist`. Host
them anywhere. The local renderer works with no backend.

To enable AI models in production, your web server must proxy the same paths the Vite config
does and add the keys server-side. Example for nginx:

```nginx
location /api/openrouter/ {
  proxy_pass https://openrouter.ai/api/v1/;
  proxy_set_header Authorization "Bearer ${OPENROUTER_API_KEY}";
  proxy_set_header Cookie "";
  proxy_ssl_server_name on;
}
location /api/huggingface/ {
  proxy_pass https://router.huggingface.co/hf-inference/;
  proxy_set_header Authorization "Bearer ${HUGGINGFACE_API_KEY}";
  proxy_set_header Cookie "";
  proxy_ssl_server_name on;
}
```

(Substitute the keys with `envsubst` or your platform's secret mechanism.) Restrict access to
the site, since anyone who can load it can spend your API credits through the proxy.

## Project structure

```
.
├── apps/
│   ├── marketing-tool/
│   │   ├── src/
│   │   │   ├── components/      # Form sections and the generator UI
│   │   │   ├── data/            # Festivals, post types, formats, model catalogue
│   │   │   ├── hooks/           # useObjectUrl
│   │   │   ├── lib/             # prompts, AI client, post content, canvas, pipeline (+ tests)
│   │   │   ├── types/
│   │   │   └── config.ts        # VITE_* settings
│   │   ├── vite.config.ts       # Tailwind + AI proxy
│   │   └── .env.example
│   └── photo-to-video/
│       ├── server/
│       │   ├── lib/             # validation, ffmpeg, jobs, ai (+ tests)
│       │   ├── app.ts           # Express app factory (+ app.test.ts)
│       │   ├── config.ts
│       │   └── index.ts         # entry point
│       ├── src/
│       │   ├── components/      # Upload → Create → Audio → Download steps
│       │   ├── lib/             # API client, formatting helpers (+ tests)
│       │   └── types.ts
│       ├── vite.config.ts       # dev proxy to the API
│       └── .env.example
├── package.json                 # workspaces + root scripts
└── .prettierrc.json
```
