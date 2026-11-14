import { describe, expect, it } from 'vitest';
import { estimateVideoLength, formatFileSize, isSupportedAudioFile } from './format';

describe('formatFileSize', () => {
  it.each([
    [0, '0 Bytes'],
    [-5, '0 Bytes'],
    [512, '512 Bytes'],
    [1536, '1.5 KB'],
    [10 * 1024 * 1024, '10 MB'],
    [5 * 1024 ** 4, '5120 GB'],
  ])('%d → %s', (bytes, expected) => {
    expect(formatFileSize(bytes)).toBe(expected);
  });
});

describe('estimateVideoLength', () => {
  it('matches the server-side cross-fade maths', () => {
    expect(estimateVideoLength(3, 2, false)).toBe(6);
    expect(estimateVideoLength(3, 2, true)).toBe(5);
    expect(estimateVideoLength(1, 2, true)).toBe(2);
    expect(estimateVideoLength(0, 2, true)).toBe(0);
  });
});

describe('isSupportedAudioFile', () => {
  it('accepts MP3s reported as audio/mpeg', () => {
    expect(isSupportedAudioFile({ name: 'song.MP3', type: 'audio/mpeg' })).toBe(true);
    expect(isSupportedAudioFile({ name: 'clip.m4a', type: 'audio/x-m4a' })).toBe(true);
  });

  it('rejects non-audio files', () => {
    expect(isSupportedAudioFile({ name: 'song.mp3', type: 'video/mp4' })).toBe(false);
    expect(isSupportedAudioFile({ name: 'image.png', type: 'image/png' })).toBe(false);
  });
});
