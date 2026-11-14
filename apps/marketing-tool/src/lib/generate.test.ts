import { beforeEach, describe, expect, it, vi } from 'vitest';
import { aspectRatios, indianFestivals } from '../data/festivals';
import { AVAILABLE_MODELS, LOCAL_MODEL } from '../data/models';
import type { PostRequest } from '../types';

vi.mock('./canvas', () => ({
  renderLocalPost: vi.fn(async () => 'data:image/png;base64,LOCAL'),
  finalizeImage: vi.fn(async (url: string) => `${url}#final`),
}));
vi.mock('./ai', () => ({
  generateImagePrompt: vi.fn(async () => ({ prompt: 'AI PROMPT', source: 'ai' })),
  generateAiImage: vi.fn(),
}));

const { generatePosts, missingRequirements } = await import('./generate');
const ai = await import('./ai');
const canvas = await import('./canvas');

const event: PostRequest = { postType: 'event', brandName: 'Test', festival: indianFestivals[0] };
const [square, landscape] = aspectRatios;
const remote = AVAILABLE_MODELS.find((m) => m.provider === 'openrouter')!;

beforeEach(() => vi.clearAllMocks());

describe('missingRequirements', () => {
  it('lists what is missing for each post type', () => {
    expect(missingRequirements({ postType: 'event', brandName: 'T' }, [])).toEqual([
      'Choose a festival to celebrate',
      'Select at least one format',
    ]);
    expect(
      missingRequirements({ postType: 'advertisement', brandName: 'T', customText: ' ' }, [square]),
    ).toEqual(['Enter your message text']);
    expect(missingRequirements(event, [square])).toEqual([]);
  });
});

describe('generatePosts', () => {
  it('renders locally without calling any API', async () => {
    const results = await generatePosts({
      request: event,
      aspectRatios: [square, landscape],
      model: LOCAL_MODEL,
    });
    expect(results).toHaveLength(2);
    expect(results.every((r) => r.model === LOCAL_MODEL.name && !r.fallbackReason)).toBe(true);
    expect(ai.generateImagePrompt).not.toHaveBeenCalled();
    expect(ai.generateAiImage).not.toHaveBeenCalled();
  });

  it('uses the AI prompt and post-processes remote images', async () => {
    vi.mocked(ai.generateAiImage).mockResolvedValue('data:image/png;base64,REMOTE');
    const progress = vi.fn();
    const results = await generatePosts({
      request: event,
      aspectRatios: [square],
      model: remote,
      logoUrl: 'blob:logo',
      onProgress: progress,
    });
    expect(results[0]).toMatchObject({
      model: remote.name,
      prompt: 'AI PROMPT',
      imageUrl: 'data:image/png;base64,REMOTE#final',
    });
    expect(canvas.finalizeImage).toHaveBeenCalledWith(
      'data:image/png;base64,REMOTE',
      square,
      'blob:logo',
    );
    expect(progress).toHaveBeenCalled();
  });

  it('falls back to local rendering per image and records why', async () => {
    vi.mocked(ai.generateAiImage)
      .mockResolvedValueOnce('data:image/png;base64,OK')
      .mockRejectedValueOnce(new Error('rate limit reached'));
    const results = await generatePosts({
      request: event,
      aspectRatios: [square, landscape],
      model: remote,
    });
    expect(results[0].fallbackReason).toBeUndefined();
    expect(results[1]).toMatchObject({
      model: LOCAL_MODEL.name,
      fallbackReason: 'rate limit reached',
      imageUrl: 'data:image/png;base64,LOCAL',
    });
  });

  it('returns nothing when no formats are selected', async () => {
    expect(await generatePosts({ request: event, aspectRatios: [], model: LOCAL_MODEL })).toEqual(
      [],
    );
  });
});
