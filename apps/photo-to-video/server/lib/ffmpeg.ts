import { spawn } from 'node:child_process';

export const OUTPUT_FPS = 30;
export const MAX_TRANSITION_SECONDS = 0.5;

export class FfmpegNotFoundError extends Error {
  constructor() {
    super(
      'FFmpeg not found. Install it and make sure it is on your PATH ' +
        '(macOS: "brew install ffmpeg", Debian/Ubuntu: "sudo apt install ffmpeg", ' +
        'Windows: https://ffmpeg.org/download.html).',
    );
    this.name = 'FfmpegNotFoundError';
  }
}

export interface SlideshowOptions {
  imagePaths: string[];
  outputPath: string;
  /** Seconds each image is on screen. */
  duration: number;
  width: number;
  height: number;
  useTransitions: boolean;
}

/** Length of the cross-fade between two slides, or 0 when transitions are off. */
export function transitionSeconds(
  duration: number,
  useTransitions: boolean,
  count: number,
): number {
  if (!useTransitions || count < 2) return 0;
  return Math.min(MAX_TRANSITION_SECONDS, duration / 2);
}

/** Total length of the rendered slideshow in seconds. */
export function slideshowLength(duration: number, count: number, transition: number): number {
  if (count === 0) return 0;
  return count * duration - (count - 1) * transition;
}

const round = (n: number) => Number(n.toFixed(3));

/**
 * Build FFmpeg arguments that render a letter-boxed slideshow. Every image is
 * looped for `duration` seconds, scaled to fit, padded to the target size and
 * then either concatenated or chained with `xfade` cross-fades.
 */
export function buildSlideshowArgs(options: SlideshowOptions): string[] {
  const { imagePaths, outputPath, duration, width, height, useTransitions } = options;
  if (imagePaths.length === 0) {
    throw new Error('At least one image is required');
  }

  const count = imagePaths.length;
  const transition = transitionSeconds(duration, useTransitions, count);

  const inputs = imagePaths.flatMap((imagePath) => [
    '-loop',
    '1',
    '-t',
    String(duration),
    '-i',
    imagePath,
  ]);

  const normalise = imagePaths.map(
    (_, i) =>
      `[${i}:v]scale=${width}:${height}:force_original_aspect_ratio=decrease,` +
      `pad=${width}:${height}:(ow-iw)/2:(oh-ih)/2:color=black,setsar=1,` +
      `fps=${OUTPUT_FPS},format=yuv420p[v${i}]`,
  );

  const joins: string[] = [];
  if (count === 1) {
    joins.push('[v0]null[out]');
  } else if (transition === 0) {
    joins.push(`${imagePaths.map((_, i) => `[v${i}]`).join('')}concat=n=${count}:v=1:a=0[out]`);
  } else {
    let previous = 'v0';
    for (let i = 1; i < count; i++) {
      const offset = round(slideshowLength(duration, i, transition) - transition);
      const label = i === count - 1 ? 'out' : `x${i}`;
      joins.push(
        `[${previous}][v${i}]xfade=transition=fade:duration=${round(transition)}:offset=${offset}[${label}]`,
      );
      previous = label;
    }
  }

  return [
    '-y',
    ...inputs,
    '-filter_complex',
    [...normalise, ...joins].join(';'),
    '-map',
    '[out]',
    '-c:v',
    'libx264',
    '-pix_fmt',
    'yuv420p',
    '-r',
    String(OUTPUT_FPS),
    '-movflags',
    '+faststart',
    outputPath,
  ];
}

/**
 * Add a music track under a video. If the video already has audio (e.g. a
 * narration) the music is ducked and mixed in; otherwise it becomes the only
 * audio track. Output length always matches the video.
 */
export function buildBackgroundMusicArgs(
  videoPath: string,
  musicPath: string,
  outputPath: string,
  videoHasAudio: boolean,
): string[] {
  const filter = videoHasAudio
    ? '[1:a]volume=0.3[music];[0:a][music]amix=inputs=2:duration=first:dropout_transition=0[aout]'
    : '[1:a]volume=0.8[aout]';

  return [
    '-y',
    '-i',
    videoPath,
    '-stream_loop',
    '-1',
    '-i',
    musicPath,
    '-filter_complex',
    filter,
    '-map',
    '0:v',
    '-map',
    '[aout]',
    '-c:v',
    'copy',
    '-c:a',
    'aac',
    '-shortest',
    '-movflags',
    '+faststart',
    outputPath,
  ];
}

/** Replace a video's audio with a narration track. */
export function buildNarrationArgs(
  videoPath: string,
  audioPath: string,
  outputPath: string,
): string[] {
  return [
    '-y',
    '-i',
    videoPath,
    '-i',
    audioPath,
    '-map',
    '0:v',
    '-map',
    '1:a',
    '-c:v',
    'copy',
    '-c:a',
    'aac',
    '-shortest',
    '-movflags',
    '+faststart',
    outputPath,
  ];
}

interface RunOptions {
  /** Called with the processed time in seconds whenever FFmpeg reports it. */
  onTime?: (seconds: number) => void;
}

const TIME_RE = /time=(\d+):(\d+):(\d+(?:\.\d+)?)/;

/** Parse the latest `time=HH:MM:SS.xx` value from an FFmpeg stderr chunk. */
export function parseFfmpegTime(chunk: string): number | null {
  const match = TIME_RE.exec(chunk);
  if (!match) return null;
  const [, h, m, s] = match;
  return Number(h) * 3600 + Number(m) * 60 + Number(s);
}

function run(binary: string, args: string[], options: RunOptions = {}): Promise<string> {
  return new Promise((resolve, reject) => {
    const child = spawn(binary, args, { stdio: ['ignore', 'pipe', 'pipe'] });
    let stdout = '';
    let stderr = '';

    child.stdout.on('data', (data: Buffer) => {
      stdout += data.toString();
    });
    child.stderr.on('data', (data: Buffer) => {
      const text = data.toString();
      // Keep only the tail; FFmpeg is chatty and we only need it for errors.
      stderr = (stderr + text).slice(-8000);
      const time = parseFfmpegTime(text);
      if (time !== null) options.onTime?.(time);
    });

    child.on('error', (error: NodeJS.ErrnoException) => {
      reject(error.code === 'ENOENT' ? new FfmpegNotFoundError() : error);
    });
    child.on('close', (code) => {
      if (code === 0) {
        resolve(stdout);
      } else {
        const lastLines = stderr.trim().split('\n').slice(-5).join('\n');
        reject(new Error(`${binary} exited with code ${code}: ${lastLines}`));
      }
    });
  });
}

export function runFfmpeg(args: string[], options?: RunOptions): Promise<string> {
  return run('ffmpeg', ['-hide_banner', '-loglevel', 'error', '-stats', ...args], options);
}

/** True if the media file contains at least one audio stream. */
export async function hasAudioStream(filePath: string): Promise<boolean> {
  const output = await run('ffprobe', [
    '-v',
    'error',
    '-select_streams',
    'a',
    '-show_entries',
    'stream=index',
    '-of',
    'csv=p=0',
    filePath,
  ]);
  return output.trim().length > 0;
}
