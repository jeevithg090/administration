import axios from 'axios';
import type { CreateVideoRequest, JobState, UploadedFile } from '../types';

/**
 * Base URL of the API. Empty means same origin (the Vite dev server proxies
 * `/api` and `/uploads`, and in production Express serves the frontend).
 */
export const API_BASE = (import.meta.env.VITE_API_URL ?? '').replace(/\/$/, '');

const http = axios.create({ baseURL: API_BASE });

export const uploadUrl = (filename: string) =>
  `${API_BASE}/uploads/${encodeURIComponent(filename)}`;
export const previewUrl = (jobId: string) => `${API_BASE}/api/preview/${jobId}`;
export const downloadUrl = (jobId: string) => `${API_BASE}/api/download/${jobId}`;

/** Extract the server's `{ error }` message from a failed request, if any. */
export function errorMessage(error: unknown, fallback: string): string {
  if (axios.isAxiosError(error)) {
    const serverMessage = (error.response?.data as { error?: unknown } | undefined)?.error;
    if (typeof serverMessage === 'string' && serverMessage) return serverMessage;
    if (!error.response) return 'Cannot reach the server. Is the API running?';
  }
  if (error instanceof Error && error.message) return error.message;
  return fallback;
}

export async function uploadImages(files: File[]): Promise<UploadedFile[]> {
  const form = new FormData();
  files.forEach((file) => form.append('images', file));
  const { data } = await http.post<{ files: UploadedFile[] }>('/api/upload', form);
  return data.files;
}

export async function createVideo(request: CreateVideoRequest): Promise<string> {
  const { data } = await http.post<{ jobId: string }>('/api/create-video', request);
  return data.jobId;
}

export async function addBackgroundMusic(videoJobId: string, music: File): Promise<string> {
  const form = new FormData();
  form.append('videoJobId', videoJobId);
  form.append('music', music);
  const { data } = await http.post<{ jobId: string }>('/api/add-background-music', form);
  return data.jobId;
}

export async function generateScript(
  videoJobId: string,
  videoDescription: string,
): Promise<string> {
  const { data } = await http.post<{ script: string }>('/api/generate-script', {
    videoJobId,
    videoDescription,
  });
  return data.script;
}

export async function generateAudio(videoJobId: string, script: string): Promise<string> {
  const { data } = await http.post<{ audioJobId: string }>('/api/generate-audio', {
    videoJobId,
    script,
  });
  return data.audioJobId;
}

export async function mixNarration(videoJobId: string, audioJobId: string): Promise<string> {
  const { data } = await http.post<{ jobId: string }>('/api/mix-ai-audio', {
    videoJobId,
    audioJobId,
  });
  return data.jobId;
}

export type JobKind = 'video' | 'audio';

export async function getJob(kind: JobKind, jobId: string): Promise<JobState> {
  const { data } = await http.get<JobState>(`/api/${kind}-status/${jobId}`);
  return data;
}

export interface PollOptions {
  intervalMs?: number;
  signal?: AbortSignal;
  onUpdate?: (job: JobState) => void;
}

/** Poll a job until it completes; rejects with the job's error if it fails. */
export async function waitForJob(
  kind: JobKind,
  jobId: string,
  options: PollOptions = {},
): Promise<JobState> {
  const { intervalMs = 1500, signal, onUpdate } = options;
  for (;;) {
    if (signal?.aborted) throw new DOMException('Polling aborted', 'AbortError');
    const job = await getJob(kind, jobId);
    onUpdate?.(job);
    if (job.status === 'completed') return job;
    if (job.status === 'failed') throw new Error(job.error ?? 'Processing failed');
    await new Promise((resolve) => setTimeout(resolve, intervalMs));
  }
}
