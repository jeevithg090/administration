import { useState, useCallback } from 'react';
import ImageUploader from './components/ImageUploader';
import VideoProcessor from './components/VideoProcessor';
import AudioProcessor from './components/AudioProcessor';
import VideoDownloader from './components/VideoDownloader';
import './App.css';

interface UploadedFile {
  filename: string;
  originalName: string;
  path: string;
  size: number;
}

function App() {
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([]);
  const [currentJobId, setCurrentJobId] = useState<string | null>(null);
  const [videoCompleted, setVideoCompleted] = useState(false);
  const [finalJobId, setFinalJobId] = useState<string | null>(null);

  const handleFilesUploaded = useCallback((files: UploadedFile[]) => {
    setUploadedFiles(files);
    setCurrentJobId(null);
  }, []);

  const handleVideoStarted = useCallback((jobId: string) => {
    setCurrentJobId(jobId);
  }, []);

  const handleVideoCompleted = useCallback((jobId: string) => {
    setVideoCompleted(true);
    // Keep the current job ID for audio processing
  }, []);

  const handleAudioProcessed = useCallback((finalJobId: string) => {
    setFinalJobId(finalJobId);
    setVideoCompleted(false); // Hide audio processor
  }, []);

  const handleSkipAudio = useCallback(() => {
    // Skip audio processing and go directly to download with current video
    setFinalJobId(currentJobId);
    setVideoCompleted(false);
  }, [currentJobId]);

  const handleAudioError = useCallback((error: string) => {
    console.error('Audio processing error:', error);
    // Could show an error message to user
    alert(`Audio processing error: ${error}`);
  }, []);

  const handleReset = useCallback(() => {
    setUploadedFiles([]);
    setCurrentJobId(null);
    setVideoCompleted(false);
    setFinalJobId(null);
  }, []);

  return (
    <div className="app">
      <header className="app-header">
        <h1>Photo to Video Converter</h1>
        <p>Upload your images and create a beautiful slideshow video</p>
      </header>

      <main className="app-main">
        {!uploadedFiles.length && (
          <ImageUploader onFilesUploaded={handleFilesUploaded} />
        )}

        {uploadedFiles.length > 0 && !currentJobId && !videoCompleted && !finalJobId && (
          <VideoProcessor 
            files={uploadedFiles} 
            onVideoStarted={handleVideoStarted}
            onVideoCompleted={handleVideoCompleted}
            onReset={handleReset}
          />
        )}

        {videoCompleted && currentJobId && (
          <AudioProcessor
            jobId={currentJobId}
            onAudioProcessed={handleAudioProcessed}
            onSkip={handleSkipAudio}
            onError={handleAudioError}
          />
        )}

        {finalJobId && (
          <VideoDownloader 
            jobId={finalJobId} 
            onVideoCompleted={() => {}}
            onReset={handleReset}
          />
        )}
      </main>
    </div>
  );
}

export default App;
