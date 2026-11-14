# Photo to Video Converter

Upload photos, get an MP4 slideshow with cross-fades, and optionally add background music or an
AI-generated narration. React frontend plus an Express + FFmpeg API.

```bash
cp .env.example .env   # optional: OPENROUTER_API_KEY / ELEVENLABS_API_KEY
npm run dev            # web on :5173, API on :3001 (FFmpeg required)
npm test
npm run build && npm start   # production: API + built frontend on :3001
```

See the [root README](../../README.md#photo-to-video-converter) for features, the API reference,
configuration and deployment.
