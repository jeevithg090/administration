import fs from 'node:fs';
import path from 'node:path';
import { randomUUID } from 'node:crypto';
import cors from 'cors';
import express, { type ErrorRequestHandler, type Request, type Response } from 'express';
import multer from 'multer';
import { MissingApiKeyError, type AiServices } from './lib/ai.ts';
import {
  buildBackgroundMusicArgs,
  buildNarrationArgs,
  buildSlideshowArgs,
  hasAudioStream,
  runFfmpeg,
  slideshowLength,
  transitionSeconds,
} from './lib/ffmpeg.ts';
import { JobStore } from './lib/jobs.ts';
import {
  AUDIO_EXTENSIONS,
  IMAGE_EXTENSIONS,
  MAX_DESCRIPTION_LENGTH,
  MAX_IMAGES,
  MAX_SCRIPT_LENGTH,
  VIDEO_DIMENSIONS,
  allowedExtension,
  isJobId,
  parseCreateVideoBody,
  parseText,
} from './lib/validation.ts';

export interface AppOptions {
  dataDir: string;
  ai: AiServices;
  corsOrigins?: string[];
  /** Built frontend to serve at `/`, if it exists. */
  clientDistDir?: string;
  /** Override for tests; defaults to the real FFmpeg runner. */
  ffmpeg?: typeof runFfmpeg;
}

class HttpError extends Error {
  readonly status: number;

  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}

function ensureDir(dir: string): string {
  fs.mkdirSync(dir, { recursive: true });
  return dir;
}

function createUploader(
  dir: string,
  extensions: readonly string[],
  mimePrefix: string,
  maxBytes: number,
) {
  return multer({
    storage: multer.diskStorage({
      destination: dir,
      filename: (_req, file, cb) => {
        const ext = allowedExtension(file.originalname, extensions) ?? '';
        cb(null, `${randomUUID()}${ext === '.jpeg' ? '.jpg' : ext}`);
      },
    }),
    fileFilter: (_req, file, cb) => {
      if (file.mimetype.startsWith(mimePrefix) && allowedExtension(file.originalname, extensions)) {
        cb(null, true);
      } else {
        cb(new HttpError(400, `Unsupported file type. Allowed: ${extensions.join(', ')}`));
      }
    },
    limits: { fileSize: maxBytes },
  });
}

export function createApp(options: AppOptions) {
  const { ai, corsOrigins = [], clientDistDir } = options;
  const ffmpeg = options.ffmpeg ?? runFfmpeg;

  const uploadsDir = ensureDir(path.join(options.dataDir, 'uploads'));
  const videosDir = ensureDir(path.join(options.dataDir, 'videos'));
  const audioDir = ensureDir(path.join(options.dataDir, 'audio'));

  const imageUpload = createUploader(uploadsDir, IMAGE_EXTENSIONS, 'image/', 10 * 1024 * 1024);
  const musicUpload = createUploader(uploadsDir, AUDIO_EXTENSIONS, 'audio/', 25 * 1024 * 1024);

  const videoJobs = new JobStore();
  const audioJobs = new JobStore();

  /** Run `work` in the background, recording its outcome on the job. */
  function startJob(store: JobStore, id: string, work: () => Promise<string>) {
    work()
      .then((outputPath) => store.complete(id, outputPath))
      .catch((error: unknown) => {
        console.error(`Job ${id} failed:`, error instanceof Error ? error.message : error);
        store.fail(id, error);
      });
  }

  function requireCompletedVideo(id: unknown) {
    const job = isJobId(id) ? videoJobs.completed(id) : undefined;
    if (!job) throw new HttpError(400, 'Video not found or not ready');
    return job;
  }

  const app = express();
  app.disable('x-powered-by');
  if (corsOrigins.length > 0) app.use(cors({ origin: corsOrigins }));
  app.use(express.json({ limit: '100kb' }));

  app.get('/api/health', (_req, res) => {
    res.json({ status: 'ok' });
  });

  app.post('/api/upload', imageUpload.array('images', MAX_IMAGES), (req, res) => {
    const files = (req.files as Express.Multer.File[] | undefined) ?? [];
    if (files.length === 0) throw new HttpError(400, 'No files uploaded');

    res.json({
      message: 'Files uploaded successfully',
      files: files.map((file) => ({
        filename: file.filename,
        originalName: file.originalname,
        size: file.size,
      })),
    });
  });

  app.post('/api/create-video', (req, res) => {
    const parsed = parseCreateVideoBody(req.body);
    if (!parsed.ok) throw new HttpError(400, parsed.error);
    const { imageFiles, duration, useTransitions, videoQuality } = parsed.value;

    const imagePaths = imageFiles.map((name) => path.join(uploadsDir, name));
    if (!imagePaths.every((p) => fs.existsSync(p))) {
      throw new HttpError(400, 'One or more images were not found. Please upload them again.');
    }

    const jobId = randomUUID();
    videoJobs.create(jobId);

    const { width, height } = VIDEO_DIMENSIONS[videoQuality];
    const total = slideshowLength(
      duration,
      imagePaths.length,
      transitionSeconds(duration, useTransitions, imagePaths.length),
    );
    const outputPath = path.join(videosDir, `${jobId}.mp4`);

    startJob(videoJobs, jobId, async () => {
      await ffmpeg(
        buildSlideshowArgs({ imagePaths, outputPath, duration, width, height, useTransitions }),
        { onTime: (t) => videoJobs.progress(jobId, (t / total) * 100) },
      );
      return outputPath;
    });

    res.status(202).json({ jobId, message: 'Video processing started' });
  });

  const sendJob = (store: JobStore) => (req: Request, res: Response) => {
    const id = req.params.jobId;
    const job = isJobId(id) ? store.get(id) : undefined;
    if (!job) throw new HttpError(404, 'Job not found');
    res.json(JobStore.toPublic(job));
  };

  app.get('/api/video-status/:jobId', sendJob(videoJobs));
  app.get('/api/audio-status/:jobId', sendJob(audioJobs));

  // Express' sendFile handles Range requests, so this also supports seeking.
  app.get('/api/preview/:jobId', (req, res) => {
    const job = isJobId(req.params.jobId) ? videoJobs.completed(req.params.jobId) : undefined;
    if (!job) throw new HttpError(404, 'Video not found or not ready');
    res.sendFile(job.outputPath, { headers: { 'Content-Type': 'video/mp4' } });
  });

  app.get('/api/download/:jobId', (req, res) => {
    const job = isJobId(req.params.jobId) ? videoJobs.completed(req.params.jobId) : undefined;
    if (!job) throw new HttpError(404, 'Video not found or not ready');
    res.download(job.outputPath, `slideshow-${job.id}.mp4`);
  });

  app.post('/api/add-background-music', musicUpload.single('music'), (req, res) => {
    if (!req.file) throw new HttpError(400, 'No music file provided');
    const musicPath = req.file.path;
    const source = requireCompletedVideo(req.body?.videoJobId);

    const jobId = randomUUID();
    videoJobs.create(jobId);
    const outputPath = path.join(videosDir, `${jobId}.mp4`);

    startJob(videoJobs, jobId, async () => {
      const videoHasAudio = await hasAudioStream(source.outputPath);
      videoJobs.progress(jobId, 20);
      await ffmpeg(
        buildBackgroundMusicArgs(source.outputPath, musicPath, outputPath, videoHasAudio),
      );
      return outputPath;
    });

    res.status(202).json({ jobId, message: 'Background music processing started' });
  });

  app.post('/api/generate-script', async (req, res) => {
    requireCompletedVideo(req.body?.videoJobId);
    const description = parseText(
      req.body?.videoDescription,
      'Video description',
      MAX_DESCRIPTION_LENGTH,
    );
    if (!description.ok) throw new HttpError(400, description.error);

    const script = await ai.generateScript(description.value);
    res.json({ script, message: 'Script generated successfully' });
  });

  app.post('/api/generate-audio', (req, res) => {
    requireCompletedVideo(req.body?.videoJobId);
    const script = parseText(req.body?.script, 'Script', MAX_SCRIPT_LENGTH);
    if (!script.ok) throw new HttpError(400, script.error);

    const audioJobId = randomUUID();
    audioJobs.create(audioJobId, { script: script.value });
    const outputPath = path.join(audioDir, `${audioJobId}.mp3`);

    startJob(audioJobs, audioJobId, async () => {
      const audio = await ai.synthesizeSpeech(script.value);
      await fs.promises.writeFile(outputPath, audio);
      return outputPath;
    });

    res.status(202).json({ audioJobId, message: 'Audio generation started' });
  });

  app.post('/api/mix-ai-audio', (req, res) => {
    const { audioJobId } = req.body ?? {};
    const audio = isJobId(audioJobId) ? audioJobs.completed(audioJobId) : undefined;
    if (!audio) throw new HttpError(400, 'Audio not found or not ready');
    const source = requireCompletedVideo(req.body?.videoJobId);

    const jobId = randomUUID();
    videoJobs.create(jobId);
    const outputPath = path.join(videosDir, `${jobId}.mp4`);

    startJob(videoJobs, jobId, async () => {
      await ffmpeg(buildNarrationArgs(source.outputPath, audio.outputPath, outputPath));
      return outputPath;
    });

    res.status(202).json({ jobId, message: 'Narration mixing started' });
  });

  // Uploaded images are needed by the in-browser fallback renderer.
  app.use('/uploads', express.static(uploadsDir, { index: false, dotfiles: 'deny' }));

  app.use('/api', (_req, _res, next) => next(new HttpError(404, 'Not found')));

  if (clientDistDir && fs.existsSync(path.join(clientDistDir, 'index.html'))) {
    app.use(express.static(clientDistDir));
    app.get(/^(?!\/api\/|\/uploads\/).*/, (_req, res) => {
      res.sendFile(path.join(clientDistDir, 'index.html'));
    });
  }

  const errorHandler: ErrorRequestHandler = (error, _req, res, next) => {
    if (res.headersSent) return next(error);

    if (error instanceof HttpError) {
      res.status(error.status).json({ error: error.message });
    } else if (error instanceof multer.MulterError) {
      const message = error.code === 'LIMIT_FILE_SIZE' ? 'File is too large' : error.message;
      res.status(400).json({ error: message });
    } else if (error instanceof MissingApiKeyError) {
      res.status(503).json({ error: error.message });
    } else if (error?.type === 'entity.parse.failed') {
      res.status(400).json({ error: 'Malformed JSON body' });
    } else {
      console.error('Unhandled error:', error);
      res
        .status(500)
        .json({ error: error instanceof Error ? error.message : 'Internal server error' });
    }
  };
  app.use(errorHandler);

  return app;
}
