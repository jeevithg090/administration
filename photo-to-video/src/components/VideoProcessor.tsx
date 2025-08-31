import React, { useState } from 'react';
import axios from 'axios';
import ClientVideoCreator from './ClientVideoCreator';

interface UploadedFile {
  filename: string;
  originalName: string;
  path: string;
  size: number;
}

interface VideoProcessorProps {
  files: UploadedFile[];
  onVideoStarted: (jobId: string) => void;
  onVideoCompleted: (jobId: string) => void;
  onReset: () => void;
}

const VideoProcessor: React.FC<VideoProcessorProps> = ({ files, onVideoStarted, onVideoCompleted, onReset }) => {
  const [duration, setDuration] = useState(2);
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [useTransitions, setUseTransitions] = useState(true);
  const [videoQuality, setVideoQuality] = useState<'720p' | '1080p'>('720p');
  const [showClientCreator, setShowClientCreator] = useState(false);
  const [clientProgress, setClientProgress] = useState(0);

  const handleCreateVideo = async () => {
    setProcessing(true);
    setError(null);

    try {
      const imageFiles = files.map(file => file.filename);
      
      const response = await axios.post('http://localhost:3001/api/create-video', {
        imageFiles,
        duration,
        useTransitions,
        videoQuality
      });

      const jobId = response.data.jobId;
      onVideoStarted(jobId);
      
      // Poll for video completion to transition to audio processing
      pollForVideoCompletion(jobId);
    } catch (err) {
      console.error('Video creation error:', err);
      
      // Check if error is due to FFmpeg not being available
      if (axios.isAxiosError(err) && err.response?.data?.error?.includes('FFmpeg')) {
        setError('Server video processing unavailable. FFmpeg not installed.');
        setShowClientCreator(true);
      } else {
        setError('Failed to start video processing. Please try again.');
      }
      setProcessing(false);
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const handleClientVideoCreated = (videoBlob: Blob) => {
    // Create a download link for the browser-generated video
    const url = URL.createObjectURL(videoBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `browser-video-${Date.now()}.webm`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    
    setShowClientCreator(false);
    setClientProgress(0);
  };

  const handleClientVideoError = (error: string) => {
    setError(`Browser video creation failed: ${error}`);
    setShowClientCreator(false);
    setClientProgress(0);
  };

  const pollForVideoCompletion = async (jobId: string) => {
    const checkStatus = async () => {
      try {
        const response = await axios.get(`http://localhost:3001/api/video-status/${jobId}`);
        const status = response.data.status;
        
        if (status === 'completed') {
          setProcessing(false);
          onVideoCompleted(jobId);
        } else if (status === 'failed') {
          setProcessing(false);
          setError(response.data.error || 'Video processing failed');
        } else {
          // Still processing, check again
          setTimeout(checkStatus, 2000);
        }
      } catch (error) {
        console.error('Status check error:', error);
        setProcessing(false);
        setError('Failed to check video status');
      }
    };
    
    checkStatus();
  };

  return (
    <div className="video-processor">
      <h2>Create Your Video</h2>
      
      <div className="files-preview">
        <h3>Uploaded Images ({files.length})</h3>
        <div className="files-grid">
          {files.map((file, index) => (
            <div key={index} className="file-preview">
              <div className="file-number">{index + 1}</div>
              <div className="file-details">
                <div className="file-name">{file.originalName}</div>
                <div className="file-size">{formatFileSize(file.size)}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="video-settings">
        <h3>Video Settings</h3>
        <div className="setting-group">
          <label htmlFor="duration">Duration per image (seconds):</label>
          <input
            id="duration"
            type="number"
            min="0.5"
            max="10"
            step="0.5"
            value={duration}
            onChange={(e) => setDuration(parseFloat(e.target.value))}
            className="duration-input"
          />
        </div>
        
        <div className="setting-group">
          <label htmlFor="quality">Video Quality:</label>
          <select
            id="quality"
            value={videoQuality}
            onChange={(e) => setVideoQuality(e.target.value as '720p' | '1080p')}
            className="quality-select"
          >
            <option value="720p">720p (1280x720) - Faster</option>
            <option value="1080p">1080p (1920x1080) - Higher Quality</option>
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
            Add smooth transitions between images
          </label>
          <small className="setting-description">
            ✨ Creates fade transitions between images for a more professional look
          </small>
        </div>
        
        <div className="video-info">
          <p>Total video duration: {(files.length * duration).toFixed(1)} seconds</p>
          <p>Output format: MP4 ({videoQuality})</p>
          <p>Transitions: {useTransitions ? 'Enabled' : 'Disabled'}</p>
        </div>
      </div>

      {error && (
        <div className="error-message">
          {error}
        </div>
      )}

      {showClientCreator && (
        <ClientVideoCreator
          files={files}
          duration={duration}
          onVideoCreated={handleClientVideoCreated}
          onProgress={setClientProgress}
          onError={handleClientVideoError}
        />
      )}

      {clientProgress > 0 && clientProgress < 100 && (
        <div className="progress-container">
          <div className="progress-bar">
            <div 
              className="progress-fill" 
              style={{ width: `${clientProgress}%` }}
            ></div>
          </div>
          <div className="progress-text">{clientProgress.toFixed(0)}%</div>
        </div>
      )}

      <div className="action-buttons">
        <button 
          onClick={onReset}
          className="reset-button"
          disabled={processing}
        >
          Upload Different Images
        </button>
        
        <button 
          onClick={handleCreateVideo}
          disabled={processing || files.length === 0}
          className="create-video-button"
        >
          {processing ? 'Starting...' : 'Create Video'}
        </button>
      </div>
    </div>
  );
};

export default VideoProcessor;