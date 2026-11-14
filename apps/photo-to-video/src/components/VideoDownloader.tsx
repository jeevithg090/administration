import { downloadUrl, previewUrl } from '../lib/api';

interface VideoDownloaderProps {
  jobId: string;
  onReset: () => void;
}

/** Final step: the video is already rendered, so show it and offer a download. */
export default function VideoDownloader({ jobId, onReset }: VideoDownloaderProps) {
  return (
    <section className="video-downloader" aria-labelledby="result-heading">
      <h2 id="result-heading">Your video is ready</h2>

      <div className="video-preview">
        <video controls preload="metadata" src={previewUrl(jobId)} className="preview-video">
          Your browser does not support embedded video.{' '}
          <a href={downloadUrl(jobId)}>Download it instead.</a>
        </video>
      </div>

      <div className="action-buttons">
        <a href={downloadUrl(jobId)} className="download-button" download>
          📥 Download MP4
        </a>
        <button type="button" onClick={onReset} className="reset-button">
          Start over
        </button>
      </div>
    </section>
  );
}
