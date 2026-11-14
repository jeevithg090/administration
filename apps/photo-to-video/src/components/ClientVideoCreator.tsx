import { useRef, useState } from 'react';
import { uploadUrl } from '../lib/api';
import type { UploadedFile } from '../types';
import ErrorMessage from './ErrorMessage';
import ProgressBar from './ProgressBar';

const WIDTH = 1280;
const HEIGHT = 720;

interface ClientVideoCreatorProps {
  files: UploadedFile[];
  duration: number;
}

function pickMimeType(): string | null {
  const candidates = ['video/webm;codecs=vp9', 'video/webm;codecs=vp8', 'video/webm'];
  return candidates.find((type) => MediaRecorder.isTypeSupported(type)) ?? null;
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error('Failed to load an image'));
    img.src = src;
  });
}

function drawContained(ctx: CanvasRenderingContext2D, img: HTMLImageElement) {
  ctx.fillStyle = '#000';
  ctx.fillRect(0, 0, WIDTH, HEIGHT);
  const scale = Math.min(WIDTH / img.width, HEIGHT / img.height);
  const w = img.width * scale;
  const h = img.height * scale;
  ctx.drawImage(img, (WIDTH - w) / 2, (HEIGHT - h) / 2, w, h);
}

function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

/**
 * Fallback for servers without FFmpeg: records the slideshow in real time from
 * a canvas using MediaRecorder and downloads it as WebM.
 */
export default function ClientVideoCreator({ files, duration }: ClientVideoCreatorProps) {
  const [processing, setProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const createVideoInBrowser = async () => {
    setProcessing(true);
    setProgress(0);
    setError(null);

    try {
      const canvas = canvasRef.current;
      const ctx = canvas?.getContext('2d');
      if (!canvas || !ctx) throw new Error('Canvas is not available in this browser');
      if (typeof MediaRecorder === 'undefined')
        throw new Error('Video recording is not supported in this browser');
      const mimeType = pickMimeType();
      if (!mimeType) throw new Error('WebM recording is not supported in this browser');

      const images = await Promise.all(files.map((file) => loadImage(uploadUrl(file.filename))));

      const recorder = new MediaRecorder(canvas.captureStream(30), { mimeType });
      const chunks: Blob[] = [];
      recorder.ondataavailable = (event) => {
        if (event.data.size > 0) chunks.push(event.data);
      };
      const stopped = new Promise<void>((resolve) => {
        recorder.onstop = () => resolve();
      });

      drawContained(ctx, images[0]);
      recorder.start();
      for (let i = 0; i < images.length; i++) {
        drawContained(ctx, images[i]);
        setProgress((i / images.length) * 100);
        await new Promise((resolve) => setTimeout(resolve, duration * 1000));
      }
      recorder.stop();
      await stopped;

      setProgress(100);
      downloadBlob(new Blob(chunks, { type: 'video/webm' }), `slideshow-${Date.now()}.webm`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create video in browser');
    } finally {
      setProcessing(false);
    }
  };

  return (
    <div className="client-video-creator">
      <canvas ref={canvasRef} width={WIDTH} height={HEIGHT} hidden />
      <h3>Create the video in your browser instead</h3>
      <p>
        The server cannot render videos because FFmpeg is not installed. Your browser can record the
        slideshow in real time and save it as a WebM file (no transitions or audio).
      </p>

      {processing && <ProgressBar value={progress} label="Recording video in browser" />}
      <ErrorMessage message={error} />

      <button
        type="button"
        onClick={createVideoInBrowser}
        disabled={processing || files.length === 0}
        className="create-browser-video-button"
      >
        {processing ? 'Recording…' : 'Create video in browser'}
      </button>
    </div>
  );
}
