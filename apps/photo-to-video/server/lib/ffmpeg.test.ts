import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { afterAll, describe, expect, it } from 'vitest';
import {
  buildBackgroundMusicArgs,
  buildNarrationArgs,
  buildSlideshowArgs,
  hasAudioStream,
  parseFfmpegTime,
  runFfmpeg,
  slideshowLength,
  transitionSeconds,
} from './ffmpeg.ts';

const filterOf = (args: string[]) => args[args.indexOf('-filter_complex') + 1];

describe('timing helpers', () => {
  it('caps the cross-fade at half the slide duration', () => {
    expect(transitionSeconds(2, true, 3)).toBe(0.5);
    expect(transitionSeconds(0.6, true, 3)).toBe(0.3);
    expect(transitionSeconds(2, false, 3)).toBe(0);
    expect(transitionSeconds(2, true, 1)).toBe(0);
  });

  it('subtracts overlaps from the total length', () => {
    expect(slideshowLength(2, 3, 0)).toBe(6);
    expect(slideshowLength(2, 3, 0.5)).toBe(5);
    expect(slideshowLength(2, 0, 0.5)).toBe(0);
  });

  it('parses FFmpeg progress output', () => {
    expect(parseFfmpegTime('frame=  90 fps=0.0 q=-1.0 size=0kB time=00:01:02.50 bitrate=')).toBe(
      62.5,
    );
    expect(parseFfmpegTime('no progress here')).toBeNull();
  });
});

describe('buildSlideshowArgs', () => {
  const base = { outputPath: 'out.mp4', duration: 2, width: 1280, height: 720 };

  it('loops each image for the slide duration', () => {
    const args = buildSlideshowArgs({
      ...base,
      imagePaths: ['a.jpg', 'b.jpg'],
      useTransitions: false,
    });
    expect(args.join(' ')).toContain('-loop 1 -t 2 -i a.jpg -loop 1 -t 2 -i b.jpg');
    expect(args.at(-1)).toBe('out.mp4');
  });

  it('concatenates without transitions', () => {
    const args = buildSlideshowArgs({
      ...base,
      imagePaths: ['a', 'b', 'c'],
      useTransitions: false,
    });
    expect(filterOf(args)).toContain('[v0][v1][v2]concat=n=3:v=1:a=0[out]');
    expect(filterOf(args)).not.toContain('xfade');
  });

  it('chains cross-fades with the right offsets', () => {
    const args = buildSlideshowArgs({ ...base, imagePaths: ['a', 'b', 'c'], useTransitions: true });
    const filter = filterOf(args);
    expect(filter).toContain('[v0][v1]xfade=transition=fade:duration=0.5:offset=1.5[x1]');
    expect(filter).toContain('[x1][v2]xfade=transition=fade:duration=0.5:offset=3[out]');
  });

  it('scales and pads to the requested resolution', () => {
    const args = buildSlideshowArgs({
      ...base,
      width: 1920,
      height: 1080,
      imagePaths: ['a'],
      useTransitions: true,
    });
    expect(filterOf(args)).toContain('scale=1920:1080:force_original_aspect_ratio=decrease');
    expect(filterOf(args)).toContain('[v0]null[out]');
  });

  it('requires at least one image', () => {
    expect(() => buildSlideshowArgs({ ...base, imagePaths: [], useTransitions: true })).toThrow();
  });
});

describe('audio argument builders', () => {
  it('uses music as the only track when the video is silent', () => {
    const args = buildBackgroundMusicArgs('v.mp4', 'm.mp3', 'o.mp4', false);
    expect(filterOf(args)).toBe('[1:a]volume=0.8[aout]');
    expect(args).toContain('-shortest');
  });

  it('ducks and mixes music under existing audio', () => {
    const args = buildBackgroundMusicArgs('v.mp4', 'm.mp3', 'o.mp4', true);
    expect(filterOf(args)).toContain('amix=inputs=2:duration=first');
  });

  it('maps narration audio over the video stream', () => {
    const args = buildNarrationArgs('v.mp4', 'n.mp3', 'o.mp4');
    expect(args.join(' ')).toContain('-map 0:v -map 1:a -c:v copy');
  });
});

const hasFfmpeg = spawnSync('ffmpeg', ['-version']).status === 0;

describe.skipIf(!hasFfmpeg)('FFmpeg integration', () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'ptv-ffmpeg-'));
  afterAll(() => fs.rmSync(dir, { recursive: true, force: true }));

  const makeImage = async (name: string, color: string, size: string) => {
    const file = path.join(dir, name);
    await runFfmpeg([
      '-y',
      '-f',
      'lavfi',
      '-i',
      `color=c=${color}:s=${size}`,
      '-frames:v',
      '1',
      file,
    ]);
    return file;
  };

  const probeDuration = (file: string) =>
    Number(
      spawnSync('ffprobe', [
        '-v',
        'error',
        '-show_entries',
        'format=duration',
        '-of',
        'csv=p=0',
        file,
      ])
        .stdout.toString()
        .trim(),
    );

  it('renders a cross-faded slideshow, then adds music', async () => {
    const images = [
      await makeImage('a.png', 'red', '640x480'),
      await makeImage('b.jpg', 'blue', '300x900'),
      await makeImage('c.png', 'green', '1000x200'),
    ];
    const video = path.join(dir, 'slideshow.mp4');
    const times: number[] = [];
    await runFfmpeg(
      buildSlideshowArgs({
        imagePaths: images,
        outputPath: video,
        duration: 1,
        width: 640,
        height: 360,
        useTransitions: true,
      }),
      { onTime: (t) => times.push(t) },
    );

    expect(probeDuration(video)).toBeCloseTo(slideshowLength(1, 3, 0.5), 1);
    expect(await hasAudioStream(video)).toBe(false);

    const music = path.join(dir, 'tone.mp3');
    await runFfmpeg(['-y', '-f', 'lavfi', '-i', 'sine=frequency=440:duration=1', music]);
    const withMusic = path.join(dir, 'with-music.mp4');
    await runFfmpeg(buildBackgroundMusicArgs(video, music, withMusic, false));

    expect(await hasAudioStream(withMusic)).toBe(true);
    // Music is shorter than the video, so it must loop rather than truncate the video.
    expect(probeDuration(withMusic)).toBeCloseTo(probeDuration(video), 0);
  });

  it('reports a readable error for bad input', async () => {
    await expect(
      runFfmpeg(['-y', '-i', path.join(dir, 'missing.png'), path.join(dir, 'x.mp4')]),
    ).rejects.toThrow(/ffmpeg exited with code/);
  });
});
