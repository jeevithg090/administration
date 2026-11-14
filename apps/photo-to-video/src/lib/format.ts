const UNITS = ['Bytes', 'KB', 'MB', 'GB'] as const;

/** Human-readable file size, e.g. `1536` → `"1.5 KB"`. */
export function formatFileSize(bytes: number): string {
  if (!Number.isFinite(bytes) || bytes <= 0) return '0 Bytes';
  const exponent = Math.min(Math.floor(Math.log(bytes) / Math.log(1024)), UNITS.length - 1);
  const value = bytes / 1024 ** exponent;
  return `${Number.parseFloat(value.toFixed(2))} ${UNITS[exponent]}`;
}

/** Total slideshow length, accounting for overlapping cross-fades. */
export function estimateVideoLength(
  count: number,
  duration: number,
  useTransitions: boolean,
): number {
  if (count <= 0) return 0;
  const transition = useTransitions && count > 1 ? Math.min(0.5, duration / 2) : 0;
  return count * duration - (count - 1) * transition;
}

export const AUDIO_EXTENSIONS = ['.mp3', '.wav', '.ogg', '.m4a', '.aac'];

/** Browsers report inconsistent MIME types for audio, so check the extension too. */
export function isSupportedAudioFile(file: Pick<File, 'name' | 'type'>): boolean {
  const name = file.name.toLowerCase();
  return file.type.startsWith('audio/') && AUDIO_EXTENSIONS.some((ext) => name.endsWith(ext));
}
