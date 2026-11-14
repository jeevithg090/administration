import { describe, expect, it } from 'vitest';
import { aspectRatios, indianFestivals } from '../data/festivals';
import type { PostRequestContext } from '../types';
import { buildFallbackPrompt, buildPromptMessages } from './prompts';

const square = aspectRatios[0];
const diwali = indianFestivals.find((f) => f.id === 'diwali')!;
const event: PostRequestContext = {
  postType: 'event',
  brandName: 'Test College',
  festival: diwali,
  aspectRatio: square,
};

describe('buildPromptMessages', () => {
  it('includes festival context and output size', () => {
    const { system, user } = buildPromptMessages(event);
    expect(system).toContain('Return ONLY');
    expect(user).toContain('Test College');
    expect(user).toContain('celebrating Diwali');
    expect(user).toContain(diwali.keywords.join(', '));
    expect(user).toContain('1080x1080');
  });

  it('embeds the advertisement message', () => {
    const { user } = buildPromptMessages({
      ...event,
      postType: 'advertisement',
      festival: undefined,
      customText: 'MBA admissions open',
    });
    expect(user).toContain('"MBA admissions open"');
  });

  it('uses a default announcement message', () => {
    const { user } = buildPromptMessages({
      ...event,
      postType: 'announcement',
      festival: undefined,
    });
    expect(user).toContain('Important University Update');
  });
});

describe('buildFallbackPrompt', () => {
  it('describes festival posts with colours and keywords', () => {
    const prompt = buildFallbackPrompt(event);
    expect(prompt).toContain('celebrating Diwali');
    expect(prompt).toContain(diwali.colors.slice(0, 3).join(', '));
    expect(prompt).toContain('1080x1080');
  });

  it('describes advertisements and announcements', () => {
    expect(
      buildFallbackPrompt({ ...event, postType: 'advertisement', customText: 'Join us' }),
    ).toContain('Message: "Join us"');
    expect(buildFallbackPrompt({ ...event, postType: 'announcement' })).toContain(
      'Important University Update',
    );
  });
});
