export type JobStatus = 'processing' | 'completed' | 'failed';

export interface Job {
  id: string;
  status: JobStatus;
  progress: number;
  error?: string;
  /** Absolute path of the produced file (never sent to clients). */
  outputPath?: string;
  /** Narration script, for audio jobs. */
  script?: string;
  createdAt: number;
}

/** Shape of a job as returned by the status endpoints. */
export type PublicJob = Omit<Job, 'outputPath' | 'createdAt'>;

/** In-memory job registry. Jobs are lost on restart. */
export class JobStore {
  private readonly jobs = new Map<string, Job>();

  create(id: string, extra: Partial<Pick<Job, 'script'>> = {}): Job {
    const job: Job = { id, status: 'processing', progress: 0, createdAt: Date.now(), ...extra };
    this.jobs.set(id, job);
    return job;
  }

  get(id: string): Job | undefined {
    return this.jobs.get(id);
  }

  progress(id: string, progress: number): void {
    const job = this.jobs.get(id);
    if (job && job.status === 'processing') {
      job.progress = Math.max(job.progress, Math.min(99, Math.round(progress)));
    }
  }

  complete(id: string, outputPath: string): void {
    const job = this.jobs.get(id);
    if (job)
      Object.assign(job, { status: 'completed', progress: 100, outputPath, error: undefined });
  }

  fail(id: string, error: unknown): void {
    const job = this.jobs.get(id);
    if (job) {
      job.status = 'failed';
      job.error = error instanceof Error ? error.message : String(error);
    }
  }

  /** Completed job with an output file, or undefined. */
  completed(id: string): (Job & { outputPath: string }) | undefined {
    const job = this.jobs.get(id);
    return job?.status === 'completed' && job.outputPath
      ? (job as Job & { outputPath: string })
      : undefined;
  }

  static toPublic(job: Job): PublicJob {
    const { id, status, progress, error, script } = job;
    return { id, status, progress, error, script };
  }
}
