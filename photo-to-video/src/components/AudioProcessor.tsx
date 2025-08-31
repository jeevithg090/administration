import React, { useState } from 'react';
import axios from 'axios';

interface AudioProcessorProps {
  jobId: string;
  onAudioProcessed: (finalJobId: string) => void;
  onSkip: () => void;
  onError: (error: string) => void;
}

type AudioOption = 'background-music' | 'ai-dubbing';

const AudioProcessor: React.FC<AudioProcessorProps> = ({ 
  jobId, 
  onAudioProcessed, 
  onSkip, 
  onError 
}) => {
  const [selectedOption, setSelectedOption] = useState<AudioOption | null>(null);
  const [processing, setProcessing] = useState(false);
  const [videoDescription, setVideoDescription] = useState('');
  const [backgroundMusicFile, setBackgroundMusicFile] = useState<File | null>(null);
  const [progress, setProgress] = useState(0);
  const [currentStep, setCurrentStep] = useState('');

  const handleBackgroundMusic = async () => {
    if (!backgroundMusicFile) {
      onError('Please select a background music file');
      return;
    }

    setProcessing(true);
    setCurrentStep('Uploading music...');
    setProgress(10);

    try {
      const formData = new FormData();
      formData.append('music', backgroundMusicFile);
      formData.append('videoJobId', jobId);

      setCurrentStep('Mixing audio with video...');
      setProgress(50);

      const response = await axios.post('http://localhost:3001/api/add-background-music', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      setCurrentStep('Finalizing video...');
      setProgress(90);

      // Poll for completion
      const finalJobId = response.data.jobId;
      await pollForCompletion(finalJobId);
      
      setProgress(100);
      onAudioProcessed(finalJobId);
    } catch (error) {
      console.error('Background music processing error:', error);
      onError('Failed to add background music. Please try again.');
      setProcessing(false);
    }
  };

  const handleAIDubbing = async () => {
    if (!videoDescription.trim()) {
      onError('Please provide a description for the video');
      return;
    }

    setProcessing(true);
    setCurrentStep('Generating script...');
    setProgress(10);

    try {
      // Generate script with OpenRouter
      setCurrentStep('Creating AI script...');
      setProgress(25);

      const scriptResponse = await axios.post('http://localhost:3001/api/generate-script', {
        videoDescription: videoDescription.trim(),
        videoJobId: jobId
      });

      setCurrentStep('Generating speech...');
      setProgress(40);

      // Generate audio with ElevenLabs
      const audioResponse = await axios.post('http://localhost:3001/api/generate-audio', {
        script: scriptResponse.data.script,
        videoJobId: jobId
      });

      const audioJobId = audioResponse.data.audioJobId;
      
      setCurrentStep('Processing audio...');
      setProgress(60);

      // Wait for audio generation to complete
      await pollForAudioCompletion(audioJobId);

      setCurrentStep('Mixing audio with video...');
      setProgress(75);

      // Mix audio with video
      const finalResponse = await axios.post('http://localhost:3001/api/mix-ai-audio', {
        audioJobId: audioJobId,
        videoJobId: jobId
      });

      setCurrentStep('Finalizing video...');
      setProgress(90);

      // Poll for completion
      const finalJobId = finalResponse.data.jobId;
      await pollForCompletion(finalJobId);
      
      setProgress(100);
      onAudioProcessed(finalJobId);
    } catch (error) {
      console.error('AI dubbing processing error:', error);
      if (axios.isAxiosError(error) && error.response?.data?.error) {
        onError(`AI dubbing failed: ${error.response.data.error}`);
      } else {
        onError('Failed to generate AI dubbing. Please try again.');
      }
      setProcessing(false);
    }
  };

  const pollForAudioCompletion = async (audioJobId: string) => {
    return new Promise((resolve, reject) => {
      const checkAudioStatus = async () => {
        try {
          const statusResponse = await axios.get(`http://localhost:3001/api/audio-status/${audioJobId}`);
          const status = statusResponse.data.status;
          
          if (status === 'completed') {
            resolve(audioJobId);
          } else if (status === 'failed') {
            reject(new Error(statusResponse.data.error || 'Audio generation failed'));
          } else {
            // Still processing, check again
            setTimeout(checkAudioStatus, 2000);
          }
        } catch (error) {
          reject(error);
        }
      };
      
      checkAudioStatus();
    });
  };

  const pollForCompletion = async (finalJobId: string) => {
    return new Promise((resolve, reject) => {
      const checkStatus = async () => {
        try {
          const statusResponse = await axios.get(`http://localhost:3001/api/video-status/${finalJobId}`);
          const status = statusResponse.data.status;
          
          if (status === 'completed') {
            resolve(finalJobId);
          } else if (status === 'failed') {
            reject(new Error(statusResponse.data.error || 'Processing failed'));
          } else {
            // Still processing, check again
            setTimeout(checkStatus, 2000);
          }
        } catch (error) {
          reject(error);
        }
      };
      
      checkStatus();
    });
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      // Validate audio file type
      const allowedTypes = ['audio/mp3', 'audio/wav', 'audio/ogg', 'audio/m4a'];
      if (!allowedTypes.includes(file.type)) {
        onError('Please select a valid audio file (MP3, WAV, OGG, M4A)');
        return;
      }
      setBackgroundMusicFile(file);
    }
  };

  if (processing) {
    return (
      <div className="audio-processor processing">
        <h2>Adding Audio to Your Video</h2>
        <div className="progress-container">
          <div className="progress-bar">
            <div 
              className="progress-fill" 
              style={{ width: `${progress}%` }}
            ></div>
          </div>
          <div className="progress-text">{progress.toFixed(0)}%</div>
        </div>
        <div className="progress-step">{currentStep}</div>
      </div>
    );
  }

  return (
    <div className="audio-processor">
      <h2>Add Audio to Your Video</h2>
      <p>Choose how you'd like to enhance your video with audio:</p>

      <div className="audio-options">
        <div className={`audio-option ${selectedOption === 'background-music' ? 'selected' : ''}`}>
          <div className="option-header" onClick={() => setSelectedOption('background-music')}>
            <input
              type="radio"
              name="audioOption"
              value="background-music"
              checked={selectedOption === 'background-music'}
              onChange={() => setSelectedOption('background-music')}
            />
            <h3>🎵 Background Music</h3>
          </div>
          <p>Add your own background music to the slideshow</p>
          
          {selectedOption === 'background-music' && (
            <div className="option-details">
              <div className="file-upload">
                <label htmlFor="music-file" className="file-label">
                  Choose Music File:
                </label>
                <input
                  id="music-file"
                  type="file"
                  accept="audio/*"
                  onChange={handleFileChange}
                  className="file-input"
                />
                {backgroundMusicFile && (
                  <div className="selected-file">
                    Selected: {backgroundMusicFile.name}
                  </div>
                )}
              </div>
              <button 
                onClick={handleBackgroundMusic}
                disabled={!backgroundMusicFile}
                className="process-button"
              >
                Add Background Music
              </button>
            </div>
          )}
        </div>

        <div className={`audio-option ${selectedOption === 'ai-dubbing' ? 'selected' : ''}`}>
          <div className="option-header" onClick={() => setSelectedOption('ai-dubbing')}>
            <input
              type="radio"
              name="audioOption"
              value="ai-dubbing"
              checked={selectedOption === 'ai-dubbing'}
              onChange={() => setSelectedOption('ai-dubbing')}
            />
            <h3>🤖 AI Generated Dubbing</h3>
          </div>
          <p>Generate AI-powered narration based on your video content</p>
          
          {selectedOption === 'ai-dubbing' && (
            <div className="option-details">
              <div className="description-input">
                <label htmlFor="video-description">
                  Describe your video content:
                </label>
                <textarea
                  id="video-description"
                  value={videoDescription}
                  onChange={(e) => setVideoDescription(e.target.value)}
                  placeholder="Describe what your slideshow is about, the mood, and what you'd like the narration to convey..."
                  rows={4}
                  className="description-textarea"
                />
                <small className="input-hint">
                  The AI will create a script and generate natural-sounding narration based on your description.
                </small>
              </div>
              <button 
                onClick={handleAIDubbing}
                disabled={!videoDescription.trim()}
                className="process-button"
              >
                Generate AI Dubbing
              </button>
            </div>
          )}
        </div>
      </div>

      <div className="action-buttons">
        <button onClick={onSkip} className="skip-button">
          Skip Audio - Use Video As Is
        </button>
      </div>
    </div>
  );
};

export default AudioProcessor;