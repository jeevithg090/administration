import { CheckCircle2, Download, RotateCcw } from 'lucide-react';
import { downloadUrl, previewUrl } from '../lib/api';

interface VideoDownloaderProps {
  jobId: string;
  onReset: () => void;
}

/** Final step: the video is already rendered, so show it and offer a download. */
export default function VideoDownloader({ jobId, onReset }: VideoDownloaderProps) {
  return (
    <section className="card" aria-labelledby="result-heading">
      <div className="result-header">
        <span className="status-icon success" aria-hidden="true">
          <CheckCircle2 size={24} />
        </span>
        <div>
          <h2 id="result-heading" className="card-title">
            Your video is ready
          </h2>
          <p className="muted">Preview it below, then download the MP4.</p>
        </div>
      </div>

      <div className="video-frame">
        <video controls preload="metadata" src={previewUrl(jobId)}>
          Your browser does not support embedded video.{' '}
          <a href={downloadUrl(jobId)}>Download it instead.</a>
        </video>
      </div>

      <div className="actions">
        <button type="button" onClick={onReset} className="btn btn-secondary">
          <RotateCcw size={18} aria-hidden />
          Make another video
        </button>
        <a href={downloadUrl(jobId)} className="btn btn-primary" download>
          <Download size={18} aria-hidden />
          Download MP4
        </a>
      </div>
    </section>
  );
}
