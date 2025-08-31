import React, { useState, useRef } from 'react';

interface UploadedFile {
  filename: string;
  originalName: string;
  path: string;
  size: number;
}

interface ClientVideoCreatorProps {
  files: UploadedFile[];
  duration: number;
  onVideoCreated: (videoBlob: Blob) => void;
  onProgress: (progress: number) => void;
  onError: (error: string) => void;
}

const ClientVideoCreator: React.FC<ClientVideoCreatorProps> = ({
  files,
  duration,
  onVideoCreated,
  onProgress,
  onError
}) => {
  const [isProcessing, setIsProcessing] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const createVideoInBrowser = async () => {
    setIsProcessing(true);
    onProgress(0);

    try {
      const canvas = canvasRef.current;
      if (!canvas) {
        throw new Error('Canvas not available');
      }

      const ctx = canvas.getContext('2d');
      if (!ctx) {
        throw new Error('Canvas context not available');
      }

      // Set canvas dimensions
      canvas.width = 1280;
      canvas.height = 720;

      // Check if MediaRecorder is supported
      if (!MediaRecorder.isTypeSupported('video/webm')) {
        throw new Error('Video recording not supported in this browser');
      }

      const stream = canvas.captureStream(30); // 30 FPS
      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: 'video/webm;codecs=vp9'
      });

      const chunks: Blob[] = [];
      
      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          chunks.push(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        const videoBlob = new Blob(chunks, { type: 'video/webm' });
        onVideoCreated(videoBlob);
        setIsProcessing(false);
      };

      mediaRecorder.start();

      // Load and process each image
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        onProgress((i / files.length) * 100);

        // Load image
        const img = new Image();
        img.crossOrigin = 'anonymous';
        
        await new Promise<void>((resolve, reject) => {
          img.onload = () => {
            // Clear canvas with black background
            ctx.fillStyle = '#000000';
            ctx.fillRect(0, 0, canvas.width, canvas.height);

            // Calculate scaling to fit image while maintaining aspect ratio
            const scale = Math.min(
              canvas.width / img.width,
              canvas.height / img.height
            );
            
            const scaledWidth = img.width * scale;
            const scaledHeight = img.height * scale;
            
            const x = (canvas.width - scaledWidth) / 2;
            const y = (canvas.height - scaledHeight) / 2;

            // Draw image
            ctx.drawImage(img, x, y, scaledWidth, scaledHeight);

            resolve();
          };
          
          img.onerror = () => {
            reject(new Error(`Failed to load image: ${file.originalName}`));
          };
          
          // Load image from server
          img.src = `http://localhost:3001/uploads/${file.filename}`;
        });

        // Hold the frame for the specified duration
        await new Promise(resolve => setTimeout(resolve, duration * 1000));
      }

      onProgress(100);
      mediaRecorder.stop();
      
    } catch (error) {
      console.error('Client-side video creation failed:', error);
      onError(error instanceof Error ? error.message : 'Failed to create video in browser');
      setIsProcessing(false);
    }
  };

  return (
    <div className="client-video-creator">
      <canvas
        ref={canvasRef}
        style={{ display: 'none' }}
        width={1280}
        height={720}
      />
      
      <div className="fallback-info">
        <h3>🔧 Server video processing unavailable</h3>
        <p>FFmpeg is not installed on the server. You can create a video directly in your browser instead:</p>
        
        <div className="browser-info">
          <p><strong>Browser Video Creation:</strong></p>
          <ul>
            <li>✅ Works entirely in your browser</li>
            <li>✅ No server dependencies</li>
            <li>⚠️ Output format: WebM (widely supported)</li>
            <li>⚠️ May be slower for many images</li>
          </ul>
        </div>

        <button 
          onClick={createVideoInBrowser}
          disabled={isProcessing || files.length === 0}
          className="create-browser-video-button"
        >
          {isProcessing ? 'Creating Video in Browser...' : '🎬 Create Video in Browser'}
        </button>

        <div className="server-setup-info">
          <h4>💡 To enable server-side processing:</h4>
          <p>Install FFmpeg on your system:</p>
          <div className="install-commands">
            <p><strong>macOS:</strong> <code>brew install ffmpeg</code></p>
            <p><strong>Windows:</strong> Download from <a href="https://ffmpeg.org" target="_blank" rel="noopener noreferrer">ffmpeg.org</a></p>
            <p><strong>Linux:</strong> <code>sudo apt install ffmpeg</code></p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ClientVideoCreator;