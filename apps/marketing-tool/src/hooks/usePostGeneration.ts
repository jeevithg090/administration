import { useCallback, useState } from 'react';
import { generatePosts, type GenerateOptions } from '../lib/generate';
import type { AspectRatio, GeneratedImage } from '../types';

/** State machine around `generatePosts`: idle → generating → results | error. */
export function usePostGeneration() {
  const [images, setImages] = useState<GeneratedImage[]>([]);
  const [pending, setPending] = useState<AspectRatio[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [progress, setProgress] = useState('');
  const [error, setError] = useState<string | null>(null);

  const generate = useCallback(async (options: Omit<GenerateOptions, 'onProgress'>) => {
    setIsGenerating(true);
    setError(null);
    setImages([]);
    setPending(options.aspectRatios);
    try {
      setImages(await generatePosts({ ...options, onProgress: setProgress }));
      return true;
    } catch (err) {
      console.error('Generation failed:', err);
      setError(err instanceof Error ? err.message : 'Failed to generate posts.');
      return false;
    } finally {
      setIsGenerating(false);
      setPending([]);
      setProgress('');
    }
  }, []);

  const reset = useCallback(() => {
    setImages([]);
    setError(null);
  }, []);

  return { images, pending, isGenerating, progress, error, generate, reset };
}
