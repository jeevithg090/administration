import { describe, expect, it } from 'vitest';
import {
  allowedExtension,
  IMAGE_EXTENSIONS,
  isJobId,
  isStoredImageName,
  parseCreateVideoBody,
  parseText,
} from './validation.ts';

const IMAGE = '0f8fad5b-d9cb-469f-a165-70867728950e.jpg';

describe('isStoredImageName', () => {
  it('accepts names produced by the upload handler', () => {
    expect(isStoredImageName(IMAGE)).toBe(true);
    expect(isStoredImageName('0f8fad5b-d9cb-469f-a165-70867728950e.png')).toBe(true);
  });

  it.each([
    '../../etc/passwd',
    `../${IMAGE}`,
    `uploads/${IMAGE}`,
    '0f8fad5b-d9cb-469f-a165-70867728950e.svg',
    '0f8fad5b-d9cb-469f-a165-70867728950e.jpg/..',
    '',
    42,
    null,
  ])('rejects %j', (value) => {
    expect(isStoredImageName(value)).toBe(false);
  });
});

describe('isJobId', () => {
  it('accepts lowercase UUIDs only', () => {
    expect(isJobId('0f8fad5b-d9cb-469f-a165-70867728950e')).toBe(true);
    expect(isJobId('not-a-uuid')).toBe(false);
    expect(isJobId(undefined)).toBe(false);
  });
});

describe('allowedExtension', () => {
  it('normalises case and checks the allow-list', () => {
    expect(allowedExtension('Photo.JPEG', IMAGE_EXTENSIONS)).toBe('.jpeg');
    expect(allowedExtension('script.js', IMAGE_EXTENSIONS)).toBeNull();
    expect(allowedExtension('noext', IMAGE_EXTENSIONS)).toBeNull();
  });
});

describe('parseCreateVideoBody', () => {
  it('applies defaults', () => {
    expect(parseCreateVideoBody({ imageFiles: [IMAGE] })).toEqual({
      ok: true,
      value: { imageFiles: [IMAGE], duration: 2, useTransitions: true, videoQuality: '720p' },
    });
  });

  it('accepts explicit options', () => {
    const result = parseCreateVideoBody({
      imageFiles: [IMAGE],
      duration: '3.5',
      useTransitions: false,
      videoQuality: '1080p',
    });
    expect(result).toMatchObject({
      ok: true,
      value: { duration: 3.5, useTransitions: false, videoQuality: '1080p' },
    });
  });

  it.each([
    [null, 'JSON object'],
    [{}, 'No image files'],
    [{ imageFiles: [] }, 'No image files'],
    [{ imageFiles: ['../secret.jpg'] }, 'Invalid image'],
    [{ imageFiles: Array(21).fill(IMAGE) }, 'At most 20'],
    [{ imageFiles: [IMAGE], duration: 0 }, 'Duration'],
    [{ imageFiles: [IMAGE], duration: 'abc' }, 'Duration'],
    [{ imageFiles: [IMAGE], duration: 11 }, 'Duration'],
    [{ imageFiles: [IMAGE], videoQuality: '4k' }, 'videoQuality'],
  ])('rejects %j', (body, message) => {
    const result = parseCreateVideoBody(body);
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error).toContain(message);
  });
});

describe('parseText', () => {
  it('trims and enforces presence and length', () => {
    expect(parseText('  hi  ', 'Field', 10)).toEqual({ ok: true, value: 'hi' });
    expect(parseText('   ', 'Field', 10)).toEqual({ ok: false, error: 'Field is required' });
    expect(parseText(5, 'Field', 10).ok).toBe(false);
    expect(parseText('x'.repeat(11), 'Field', 10).ok).toBe(false);
  });
});
