import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import request from 'supertest';
import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest';
import { createApp } from './app.ts';
import { MissingApiKeyError, type AiServices } from './lib/ai.ts';
import { runFfmpeg } from './lib/ffmpeg.ts';

const hasFfmpeg = spawnSync('ffmpeg', ['-version']).status === 0;

// 1x1 transparent PNG.
const PNG = Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=',
  'base64',
);

function setup(ai: Partial<AiServices> = {}, ffmpeg = runFfmpeg) {
  const dataDir = fs.mkdtempSync(path.join(os.tmpdir(), 'ptv-app-'));
  const services: AiServices = {
    generateScript: vi.fn(async () => 'A short narration.'),
    synthesizeSpeech: vi.fn(async () => Buffer.alloc(0)),
    ...ai,
  };
  return { app: createApp({ dataDir, ai: services, ffmpeg }), dataDir, services };
}

async function waitFor(app: ReturnType<typeof createApp>, kind: 'video' | 'audio', id: string) {
  for (let i = 0; i < 100; i++) {
    const res = await request(app).get(`/api/${kind}-status/${id}`);
    if (res.body.status !== 'processing') return res.body;
    await new Promise((r) => setTimeout(r, 100));
  }
  throw new Error('job did not finish');
}

describe('basic routes', () => {
  const { app, dataDir } = setup();
  afterAll(() => fs.rmSync(dataDir, { recursive: true, force: true }));

  it('reports health', async () => {
    const res = await request(app).get('/api/health');
    expect(res.status).toBe(200);
    expect(res.body).toEqual({ status: 'ok' });
  });

  it('stores uploads under server-generated names', async () => {
    const res = await request(app)
      .post('/api/upload')
      .attach('images', PNG, { filename: '../../evil name.PNG', contentType: 'image/png' });
    expect(res.status).toBe(200);
    const [file] = res.body.files;
    // The multipart parser strips directory components from client file names.
    expect(file.originalName).toBe('evil name.PNG');
    expect(file.filename).toMatch(/^[0-9a-f-]{36}\.png$/);
    expect(file).not.toHaveProperty('path');
    expect(fs.existsSync(path.join(dataDir, 'uploads', file.filename))).toBe(true);
  });

  it('rejects non-image uploads', async () => {
    const res = await request(app)
      .post('/api/upload')
      .attach('images', Buffer.from('hi'), { filename: 'notes.txt', contentType: 'text/plain' });
    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/Unsupported file type/);
  });

  it('rejects an upload with no files', async () => {
    const res = await request(app).post('/api/upload');
    expect(res.status).toBe(400);
  });

  it('refuses path traversal in image references', async () => {
    const res = await request(app)
      .post('/api/create-video')
      .send({ imageFiles: ['../../../etc/passwd'] });
    expect(res.status).toBe(400);
    expect(res.body.error).toBe('Invalid image file reference');
  });

  it('refuses references to images that were never uploaded', async () => {
    const res = await request(app)
      .post('/api/create-video')
      .send({ imageFiles: ['0f8fad5b-d9cb-469f-a165-70867728950e.png'] });
    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/not found/);
  });

  it('returns 400 for malformed JSON', async () => {
    const res = await request(app)
      .post('/api/create-video')
      .set('Content-Type', 'application/json')
      .send('{nope');
    expect(res.status).toBe(400);
    expect(res.body.error).toBe('Malformed JSON body');
  });

  it('returns 404 for unknown jobs and routes', async () => {
    expect((await request(app).get('/api/video-status/nope')).status).toBe(404);
    expect(
      (await request(app).get('/api/preview/0f8fad5b-d9cb-469f-a165-70867728950e')).status,
    ).toBe(404);
    expect((await request(app).get('/api/does-not-exist')).status).toBe(404);
  });

  it('requires a finished video before generating a script', async () => {
    const res = await request(app)
      .post('/api/generate-script')
      .send({ videoJobId: '0f8fad5b-d9cb-469f-a165-70867728950e', videoDescription: 'x' });
    expect(res.status).toBe(400);
  });
});

describe('job failure handling', () => {
  it('records FFmpeg errors on the job', async () => {
    const failing = vi.fn(async () => {
      throw new Error('FFmpeg not found. Install it.');
    });
    const { app, dataDir } = setup({}, failing);
    const upload = await request(app)
      .post('/api/upload')
      .attach('images', PNG, { filename: 'a.png', contentType: 'image/png' });

    const create = await request(app)
      .post('/api/create-video')
      .send({ imageFiles: [upload.body.files[0].filename] });
    expect(create.status).toBe(202);

    const job = await waitFor(app, 'video', create.body.jobId);
    expect(job).toMatchObject({ status: 'failed', error: 'FFmpeg not found. Install it.' });
    expect(job).not.toHaveProperty('outputPath');
    fs.rmSync(dataDir, { recursive: true, force: true });
  });
});

describe.skipIf(!hasFfmpeg)('end-to-end video pipeline', () => {
  let ctx: ReturnType<typeof setup>;
  let videoJobId: string;

  beforeAll(async () => {
    ctx = setup({
      synthesizeSpeech: vi.fn(async () => {
        const file = path.join(ctx.dataDir, 'voice.mp3');
        await runFfmpeg(['-y', '-f', 'lavfi', '-i', 'sine=frequency=300:duration=1', file]);
        return fs.readFileSync(file);
      }),
    });

    const upload = await request(ctx.app)
      .post('/api/upload')
      .attach('images', PNG, { filename: 'one.png', contentType: 'image/png' })
      .attach('images', PNG, { filename: 'two.png', contentType: 'image/png' });
    const create = await request(ctx.app)
      .post('/api/create-video')
      .send({
        imageFiles: upload.body.files.map((f: { filename: string }) => f.filename),
        duration: 1,
      });
    videoJobId = create.body.jobId;
    const job = await waitFor(ctx.app, 'video', videoJobId);
    expect(job.status).toBe('completed');
  });

  afterAll(() => fs.rmSync(ctx.dataDir, { recursive: true, force: true }));

  it('serves the video with range support', async () => {
    const full = await request(ctx.app).get(`/api/preview/${videoJobId}`);
    expect(full.status).toBe(200);
    expect(full.headers['content-type']).toBe('video/mp4');

    const partial = await request(ctx.app)
      .get(`/api/preview/${videoJobId}`)
      .set('Range', 'bytes=0-99');
    expect(partial.status).toBe(206);
    expect(partial.headers['content-length']).toBe('100');
  });

  it('downloads the video as an attachment', async () => {
    const res = await request(ctx.app).get(`/api/download/${videoJobId}`);
    expect(res.status).toBe(200);
    expect(res.headers['content-disposition']).toContain(`slideshow-${videoJobId}.mp4`);
  });

  it('adds background music', async () => {
    const tone = path.join(ctx.dataDir, 'tone.mp3');
    await runFfmpeg(['-y', '-f', 'lavfi', '-i', 'sine=frequency=440:duration=1', tone]);
    const res = await request(ctx.app)
      .post('/api/add-background-music')
      .field('videoJobId', videoJobId)
      .attach('music', tone, { contentType: 'audio/mpeg' });
    expect(res.status).toBe(202);
    expect((await waitFor(ctx.app, 'video', res.body.jobId)).status).toBe('completed');
  });

  it('runs the narration flow', async () => {
    const script = await request(ctx.app)
      .post('/api/generate-script')
      .send({ videoJobId, videoDescription: 'Our trip to the hills' });
    expect(script.status).toBe(200);
    expect(script.body.script).toBe('A short narration.');
    expect(ctx.services.generateScript).toHaveBeenCalledWith('Our trip to the hills');

    const audio = await request(ctx.app)
      .post('/api/generate-audio')
      .send({ videoJobId, script: script.body.script });
    expect(audio.status).toBe(202);
    expect((await waitFor(ctx.app, 'audio', audio.body.audioJobId)).status).toBe('completed');

    const mix = await request(ctx.app)
      .post('/api/mix-ai-audio')
      .send({ videoJobId, audioJobId: audio.body.audioJobId });
    expect(mix.status).toBe(202);
    expect((await waitFor(ctx.app, 'video', mix.body.jobId)).status).toBe('completed');
  });

  it('returns 503 when an AI key is not configured', async () => {
    vi.mocked(ctx.services.generateScript).mockRejectedValueOnce(
      new MissingApiKeyError('Script generation', 'OPENROUTER_API_KEY'),
    );
    const res = await request(ctx.app)
      .post('/api/generate-script')
      .send({ videoJobId, videoDescription: 'Anything' });
    expect(res.status).toBe(503);
    expect(res.body.error).toContain('OPENROUTER_API_KEY');
  });
});
