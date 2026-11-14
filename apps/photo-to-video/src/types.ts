export interface UploadedFile {
  filename: string;
  originalName: string;
  size: number;
}

export type JobStatus = 'processing' | 'completed' | 'failed';

export interface JobState {
  id: string;
  status: JobStatus;
  progress: number;
  error?: string;
  script?: string;
}

export type VideoQuality = '720p' | '1080p';

export interface CreateVideoRequest {
  imageFiles: string[];
  duration: number;
  useTransitions: boolean;
  videoQuality: VideoQuality;
}
