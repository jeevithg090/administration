import { afterEach, describe, expect, it, vi } from 'vitest';
import { aspectRatios, indianFestivals } from '../data/festivals';
import { AVAILABLE_MODELS, LOCAL_MODEL } from '../data/models';
import {
  AiRequestError,
  describeHttpError,
  extractOpenRouterImage,
  generateAiImage,
  generateImagePrompt,
  huggingFaceSize,
} from './ai';

const square = aspectRatios.find((r) => r.id === '1:1')!;
const story = aspectRatios.find((r) => r.id === '9:16')!;
const request = {
  postType: 'event' as const,
  brandName: 'Test College',
  festival: indianFestivals[0],
  aspectRatio: square,
};

afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe('describeHttpError', () => {
  it('maps common statuses to helpful messages', () => {
    expect(describeHttpError('X', 401)).toMatch(/API key/);
    expect(describeHttpError('X', 429)).toMatch(/rate limit/);
    expect(describeHttpError('X', 503)).toMatch(/unavailable/);
    expect(describeHttpError('X', 418)).toBe('X request failed (HTTP 418).');
  });
});

describe('extractOpenRouterImage', () => {
  it('reads images from the message.images array', () => {
    expect(
      extractOpenRouterImage({
        choices: [{ message: { images: [{ image_url: { url: 'data:image/png;base64,AAA=' } }] } }],
      }),
    ).toBe('data:image/png;base64,AAA=');
  });

  it('finds an image URL embedded in content', () => {
    expect(
      extractOpenRouterImage({
        choices: [{ message: { content: 'Here: https://cdn.example.com/a.png done' } }],
      }),
    ).toBe('https://cdn.example.com/a.png');
  });

  it('returns null when there is no image', () => {
    expect(extractOpenRouterImage({ choices: [{ message: { content: 'sorry' } }] })).toBeNull();
    expect(extractOpenRouterImage({})).toBeNull();
  });
});

describe('huggingFaceSize', () => {
  it('scales down to 1024 and snaps to multiples of 8', () => {
    expect(huggingFaceSize(square)).toEqual({ width: 1024, height: 1024 });
    const size = huggingFaceSize(story);
    expect(size.height).toBe(1024);
    expect(size.width % 8).toBe(0);
    expect(size.width).toBe(576);
  });
});

describe('generateImagePrompt', () => {
  it('returns the model output when the proxy succeeds', async () => {
    const fetchMock = vi.fn(async () =>
      Response.json({ choices: [{ message: { content: '  A golden diya scene  ' } }] }),
    );
    vi.stubGlobal('fetch', fetchMock);

    await expect(generateImagePrompt(request)).resolves.toEqual({
      prompt: 'A golden diya scene',
      source: 'ai',
    });
    const [url, init] = fetchMock.mock.calls[0] as unknown as [string, RequestInit];
    expect(url).toBe('/api/openrouter/chat/completions');
    // The browser never sends credentials; the proxy adds them.
    expect(JSON.stringify(init.headers)).not.toMatch(/authorization/i);
  });

  it('falls back to the template prompt on HTTP errors', async () => {
    vi.spyOn(console, 'warn').mockImplementation(() => {});
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => new Response('nope', { status: 401 })),
    );
    const result = await generateImagePrompt(request);
    expect(result.source).toBe('template');
    expect(result.prompt).toContain('Test College');
  });

  it('falls back when the network is down', async () => {
    vi.spyOn(console, 'warn').mockImplementation(() => {});
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => Promise.reject(new TypeError('offline'))),
    );
    expect((await generateImagePrompt(request)).source).toBe('template');
  });
});

describe('generateAiImage', () => {
  const openRouter = AVAILABLE_MODELS.find((m) => m.provider === 'openrouter')!;
  const huggingFace = AVAILABLE_MODELS.find((m) => m.provider === 'huggingface')!;

  it('requests image output from OpenRouter', async () => {
    const fetchMock = vi.fn(async () =>
      Response.json({
        choices: [{ message: { images: [{ image_url: { url: 'data:image/png;base64,AA==' } }] } }],
      }),
    );
    vi.stubGlobal('fetch', fetchMock);
    await expect(generateAiImage(openRouter, 'prompt', square)).resolves.toBe(
      'data:image/png;base64,AA==',
    );
    const body = JSON.parse(
      (fetchMock.mock.calls[0] as unknown as [string, RequestInit])[1].body as string,
    );
    expect(body).toMatchObject({ model: openRouter.model, modalities: ['image', 'text'] });
  });

  it('throws a descriptive error on rate limits', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => new Response('', { status: 429 })),
    );
    await expect(generateAiImage(huggingFace, 'prompt', square)).rejects.toThrow(/rate limit/);
  });

  it('rejects non-image responses from Hugging Face', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => Response.json({ error: 'loading' })),
    );
    await expect(generateAiImage(huggingFace, 'prompt', square)).rejects.toBeInstanceOf(
      AiRequestError,
    );
  });

  it('refuses to call a local model remotely', async () => {
    await expect(generateAiImage(LOCAL_MODEL, 'prompt', square)).rejects.toThrow();
  });
});
