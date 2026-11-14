import { useEffect, useRef, useState } from 'react';
import { createVideo, errorMessage, uploadUrl, waitForJob } from '../lib/api';
import { estimateVideoLength, formatFileSize } from '../lib/format';
import type { UploadedFile, VideoQuality } from '../types';
import ClientVideoCreator from './ClientVideoCreator';
import ErrorMessage from './ErrorMessage';
import ProgressBar from './ProgressBar';

interface VideoProcessorProps {
  files: UploadedFile[];
  onVideoCompleted: (jobId: string) => void;
  onReset: () => void;
}

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

  return (
    <section className="video-processor" aria-labelledby="create-heading">
      <h2 id="create-heading">Create your video</h2>

      <div className="files-preview">
        <h3>Uploaded images ({files.length})</h3>
        <ol className="files-grid">
          {files.map((file, index) => (
            <li key={file.filename} className="file-preview">
              <img src={uploadUrl(file.filename)} alt="" className="file-thumb" loading="lazy" />
              <span className="file-number" aria-hidden="true">
                {index + 1}
              </span>
              <div className="file-details">
                <div className="file-name">{file.originalName}</div>
                <div className="file-size">{formatFileSize(file.size)}</div>
              </div>
            </li>
          ))}
        </ol>
      </div>

      <fieldset className="video-settings" disabled={processing}>
        <legend>Video settings</legend>
        <div className="setting-group">
          <label htmlFor="duration">Seconds per image</label>
          <input
            id="duration"
            type="number"
            min="0.5"
            max="10"
            step="0.5"
            value={Number.isFinite(duration) ? duration : ''}
            onChange={(e) => setDuration(Number.parseFloat(e.target.value))}
            className="duration-input"
            aria-invalid={!durationValid}
            aria-describedby="duration-hint"
          />
          <small id="duration-hint" className="setting-description">
            Between 0.5 and 10 seconds.
          </small>
        </div>

        <div className="setting-group">
          <label htmlFor="quality">Video quality</label>
          <select
            id="quality"
            value={videoQuality}
            onChange={(e) => setVideoQuality(e.target.value as VideoQuality)}
            className="quality-select"
          >
            <option value="720p">720p (1280×720) – faster</option>
            <option value="1080p">1080p (1920×1080) – sharper</option>
          </select>
        </div>

        <div className="setting-group">
          <label className="checkbox-label">
            <input
              type="checkbox"
              checked={useTransitions}
              onChange={(e) => setUseTransitions(e.target.checked)}
              className="transition-checkbox"
            />
            Cross-fade between images
          </label>
        </div>

        <div className="video-info">
          <p>
            Estimated length:{' '}
            {durationValid
              ? `${estimateVideoLength(files.length, duration, useTransitions).toFixed(1)} s`
              : '–'}
          </p>
          <p>Output: MP4 (H.264, {videoQuality})</p>
        </div>
      </fieldset>

      {processing && (
        <div aria-live="polite">
          <ProgressBar value={progress} label="Rendering video" />
          <p className="progress-step">Rendering your slideshow…</p>
        </div>
      )}

      <ErrorMessage message={error} />

      {ffmpegMissing && <ClientVideoCreator files={files} duration={duration} />}

      <div className="action-buttons">
        <button type="button" onClick={onReset} className="reset-button" disabled={processing}>
          Upload different images
        </button>
        <button
          type="button"
          onClick={handleCreateVideo}
          disabled={processing || files.length === 0 || !durationValid}
          className="create-video-button"
        >
          {processing ? 'Creating…' : 'Create video'}
        </button>
      </div>
    </section>
  );
}
