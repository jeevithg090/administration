import React, { useState, useEffect } from 'react';
import axios from 'axios';

interface VideoJob {
  id: string;
  status: 'processing' | 'completed' | 'failed';
  videoPath?: string;
  error?: string;
  progress?: number;
}

interface VideoDownloaderProps {
  jobId: string;
  onVideoCompleted: () => void;
  onReset: () => void;
}

const VideoDownloader: React.FC<VideoDownloaderProps> = ({ jobId, onVideoCompleted, onReset }) => {
  const [job, setJob] = useState<VideoJob | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [polling, setPolling] = useState(true);
  const [showPreview, setShowPreview] = useState(false);

  useEffect(() => {
    let pollInterval: NodeJS.Timeout;

    const pollStatus = async () => {
      try {
        const response = await axios.get(`http://localhost:3001/api/video-status/${jobId}`);
        const jobData = response.data;
        setJob(jobData);

        if (jobData.status === 'completed') {
          setPolling(false);
          onVideoCompleted();
        } else if (jobData.status === 'failed') {
          setPolling(false);
          setError(jobData.error || 'Video processing failed');
        }
      } catch (err) {
        console.error('Status polling error:', err);
        setError('Failed to check video status');
        setPolling(false);
      }
    };

    if (polling) {
      pollStatus(); // Initial check
      pollInterval = setInterval(pollStatus, 2000); // Poll every 2 seconds
    }

    return () => {
      if (pollInterval) {
        clearInterval(pollInterval);
      }
    };
  }, [jobId, polling, onVideoCompleted]);

  const handleDownload = () => {
    if (job?.status === 'completed') {
      const downloadUrl = `http://localhost:3001/api/download/${jobId}`;
      const link = document.createElement('a');
      link.href = downloadUrl;
      link.download = `video-${jobId}.mp4`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  const handlePreview = () => {
    setShowPreview(!showPreview);
  };

  const getPreviewUrl = () => {
    return `http://localhost:3001/api/preview/${jobId}`;
  };

  const getStatusText = () => {
    if (!job) return 'Initializing...';
    
    switch (job.status) {
      case 'processing':
        return job.progress ? `Processing... ${job.progress}%` : 'Processing...';
      case 'completed':
        return 'Video ready for download!';
      case 'failed':
        return 'Processing failed';
      default:
        return 'Unknown status';
    }
  };

  const getStatusIcon = () => {
    if (!job) return '⏳';
    
    switch (job.status) {
      case 'processing':
        return '⚙️';
      case 'completed':
        return '✅';
      case 'failed':
        return '❌';
      default:
        return '❓';
    }
  };

  return (
    <div className="video-downloader">
      <h2>Video Processing</h2>
      
      <div className="status-container">
        <div className="status-icon">{getStatusIcon()}</div>
        <div className="status-text">{getStatusText()}</div>
        
        {job?.status === 'processing' && (
          <div className="progress-container">
            <div className="progress-bar">
              <div 
                className="progress-fill" 
                style={{ width: `${job.progress || 0}%` }}
              ></div>
            </div>
            <div className="progress-text">{job.progress || 0}%</div>
          </div>
        )}
      </div>

      {error && (
        <div className="error-message">
          <h3>Error</h3>
          <p>{error}</p>
        </div>
      )}

      {job?.status === 'failed' && job.error && (
        <div className="error-message">
          <h3>Processing Failed</h3>
          <p>{job.error}</p>
        </div>
      )}

      <div className="action-buttons">
        {job?.status === 'completed' && (
          <>
            <button 
              onClick={handlePreview}
              className="preview-button"
            >
              {showPreview ? '🙈 Hide Preview' : '👁️ Preview Video'}
            </button>
            
            <button 
              onClick={handleDownload}
              className="download-button"
            >
              📥 Download Video
            </button>
          </>
        )}
        
        <button 
          onClick={onReset}
          className="reset-button"
        >
          Start Over
        </button>
      </div>

      {job?.status === 'completed' && showPreview && (
        <div className="video-preview">
          <h3>Video Preview</h3>
          <video 
            controls 
            width="100%" 
            style={{ maxWidth: '600px', borderRadius: '8px' }}
            poster="data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAwIiBoZWlnaHQ9IjMzOCIgdmlld0JveD0iMCAwIDYwMCAzMzgiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSI2MDAiIGhlaWdodD0iMzM4IiBmaWxsPSIjZjNmNGY2Ii8+Cjx0ZXh0IHg9IjMwMCIgeT0iMTY5IiBmb250LWZhbWlseT0iQXJpYWwiIGZvbnQtc2l6ZT0iMTgiIGZpbGw9IiM2YjcyODAiIHRleHQtYW5jaG9yPSJtaWRkbGUiPllvdXIgVmlkZW88L3RleHQ+Cjwvc3ZnPg=="
          >
            <source src={getPreviewUrl()} type="video/mp4" />
            Your browser does not support the video tag.
          </video>
          <p className="preview-note">
            💡 Preview your video before downloading. The video will play directly in your browser.
          </p>
        </div>
      )}

      {job?.status === 'processing' && (
        <div className="processing-info">
          <p>Please wait while we create your video...</p>
          <p>This may take a few minutes depending on the number of images.</p>
        </div>
      )}
    </div>
  );
};

export default VideoDownloader;