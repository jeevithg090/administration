import { useEffect, useRef, useState } from 'react';
import { ArrowLeft, Film, Loader2 } from 'lucide-react';
import { createVideo, errorMessage, uploadUrl, waitForJob } from '../lib/api';
import { estimateVideoLength } from '../lib/format';
import type { UploadedFile, VideoQuality } from '../types';
import ClientVideoCreator from './ClientVideoCreator';
import ErrorMessage from './ErrorMessage';
import ProgressBar from './ProgressBar';

interface VideoProcessorProps {
  files: UploadedFile[];
  onVideoCompleted: (jobId: string) => void;
  onReset: () => void;
}

const RESOLUTION: Record<VideoQuality, string> = { '720p': '1280×720', '1080p': '1920×1080' };

export default function VideoProcessor({ files, onVideoCompleted, onReset }: VideoProcessorProps) {
  const [duration, setDuration] = useState(2);
  const [useTransitions, setUseTransitions] = useState(true);
  const [videoQuality, setVideoQuality] = useState<VideoQuality>('720p');
  const [processing, setProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [ffmpegMissing, setFfmpegMissing] = useState(false);
  const abortRef = useRef<AbortController | null>(null);

  useEffect(() => () => abortRef.current?.abort(), []);

  const durationValid = Number.isFinite(duration) && duration >= 0.5 && duration <= 10;

  const handleCreateVideo = async () => {
    setProcessing(true);
    setProgress(0);
    setError(null);
    abortRef.current = new AbortController();

    try {
      const jobId = await createVideo({
        imageFiles: files.map((file) => file.filename),
        duration,
        useTransitions,
        videoQuality,
      });
      await waitForJob('video', jobId, {
        signal: abortRef.current.signal,
        onUpdate: (job) => setProgress(job.progress),
      });
      onVideoCompleted(jobId);
    } catch (err) {
      if (err instanceof DOMException && err.name === 'AbortError') return;
      const message = errorMessage(err, 'Video processing failed. Please try again.');
      setFfmpegMissing(message.includes('FFmpeg not found'));
      setError(message);
      setProcessing(false);
    }
  };

  if (processing) {
    return (
      <section className="card" aria-labelledby="create-heading" aria-busy="true">
        <div className="status-panel">
          <span className="status-icon" aria-hidden="true">
            <Loader2 size={26} className="spin" />
          </span>
          <h2 id="create-heading" className="card-title" tabIndex={-1}>
            Rendering your slideshow
          </h2>
          <p>
            {files.length} image{files.length === 1 ? '' : 's'} at {videoQuality}. This usually
            takes a few seconds per image.
          </p>
          <ProgressBar value={progress} label="Rendering video" />
        </div>
      </section>
    );
  }

  return (
    <section className="card" aria-labelledby="create-heading">
      <div className="card-header">
        <h2 id="create-heading" tabIndex={-1}>
          Set up your video
        </h2>
        <p>Choose how long each photo is shown and the output quality.</p>
      </div>

      <div className="stack">
        <div>
          <h3 className="section-title">
            {files.length} uploaded image{files.length === 1 ? '' : 's'}
          </h3>
          <ol className="thumb-grid" aria-label="Slide order">
            {files.map((file, index) => (
              <li key={file.filename} className="thumb">
                <img src={uploadUrl(file.filename)} alt="" loading="lazy" />
                <span className="thumb-index" aria-hidden="true">
                  {index + 1}
                </span>
                <div className="thumb-meta">
                  <span className="thumb-name" title={file.originalName}>
                    {file.originalName}
                  </span>
                </div>
              </li>
            ))}
          </ol>
        </div>

        <fieldset className="settings">
          <legend className="section-title">Settings</legend>
          <div className="settings-grid">
            <div className="field">
              <label htmlFor="duration" className="field-label">
                Seconds per image
              </label>
              <input
                id="duration"
                type="number"
                inputMode="decimal"
                min="0.5"
                max="10"
                step="0.5"
                value={Number.isFinite(duration) ? duration : ''}
                onChange={(e) => setDuration(Number.parseFloat(e.target.value))}
                className="input"
                aria-invalid={!durationValid}
                aria-describedby="duration-hint"
              />
              {durationValid ? (
                <small id="duration-hint" className="field-hint">
                  Between 0.5 and 10 seconds.
                </small>
              ) : (
                <small id="duration-hint" className="field-error" role="alert">
                  Enter a number between 0.5 and 10.
                </small>
              )}
            </div>

            <div className="field">
              <label htmlFor="quality" className="field-label">
                Video quality
              </label>
              <select
                id="quality"
                value={videoQuality}
                onChange={(e) => setVideoQuality(e.target.value as VideoQuality)}
                className="select"
                aria-describedby="quality-hint"
              >
                <option value="720p">720p HD (1280×720)</option>
                <option value="1080p">1080p Full HD (1920×1080)</option>
              </select>
              <small id="quality-hint" className="field-hint">
                720p renders faster; 1080p is sharper.
              </small>
            </div>

            <label className="switch full">
              <span className="switch-text">
                <span className="field-label">Cross-fade between images</span>
                <span className="field-hint">A 0.5 s dissolve from one photo to the next.</span>
              </span>
              <input
                type="checkbox"
                role="switch"
                checked={useTransitions}
                onChange={(e) => setUseTransitions(e.target.checked)}
              />
            </label>
          </div>
        </fieldset>

        <dl className="summary" aria-label="Output summary">
          <div>
            <dt>Length</dt>
            <dd>
              {durationValid
                ? `${estimateVideoLength(files.length, duration, useTransitions).toFixed(1)} s`
                : '–'}
            </dd>
          </div>
          <div>
            <dt>Size</dt>
            <dd>{RESOLUTION[videoQuality]}</dd>
          </div>
          <div>
            <dt>Format</dt>
            <dd>MP4 (H.264)</dd>
          </div>
        </dl>

        <ErrorMessage title="Couldn't create the video" message={error} />

        {ffmpegMissing && <ClientVideoCreator files={files} duration={duration} />}
      </div>

      <div className="actions">
        <button type="button" onClick={onReset} className="btn btn-secondary">
          <ArrowLeft size={18} aria-hidden />
          Choose different images
        </button>
        <span className="spacer" />
        <button
          type="button"
          onClick={handleCreateVideo}
          disabled={files.length === 0 || !durationValid}
          className="btn btn-primary"
        >
          <Film size={18} aria-hidden />
          Create video
        </button>
      </div>
    </section>
  );
}
