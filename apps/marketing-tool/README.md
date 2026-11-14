# Marketing Post Generator

Create branded festival greetings, advertisements and announcements for Instagram, Facebook,
YouTube, X and LinkedIn in one click. Posts are rendered locally on a canvas, or with an AI image
model through a server-side proxy that keeps API keys out of the browser.

```bash
cp .env.example .env   # optional: OPENROUTER_API_KEY / HUGGINGFACE_API_KEY
npm run dev            # http://localhost:5173
npm test
npm run build          # static files in dist/
```

See the [root README](../../README.md#marketing-post-generator) for features, architecture,
configuration and production proxy setup.
