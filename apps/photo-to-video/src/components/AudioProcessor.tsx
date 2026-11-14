import { useEffect, useRef, useState, type ChangeEvent } from 'react';
import {
  addBackgroundMusic,
  errorMessage,
  generateAudio,
  generateScript,
  mixNarration,
  waitForJob,
} from '../lib/api';
import { isSupportedAudioFile } from '../lib/format';
import ErrorMessage from './ErrorMessage';
import ProgressBar from './ProgressBar';

interface AudioProcessorProps {
  jobId: string;
  onAudioProcessed: (finalJobId: string) => void;
  onSkip: () => void;
}

type AudioOption = 'background-music' | 'ai-dubbing';

export default function AudioProcessor({ jobId, onAudioProcessed, onSkip }: AudioProcessorProps) {
  const [option, setOption] = useState<AudioOption | null>(null);
  const [musicFile, setMusicFile] = useState<File | null>(null);
  const [description, setDescription] = useState('');
  const [processing, setProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [step, setStep] = useState('');
  const [error, setError] = useState<string | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  useEffect(() => () => abortRef.current?.abort(), []);

  const run = async (work: (signal: AbortSignal) => Promise<string>, fallback: string) => {
    setProcessing(true);
    setError(null);
    setProgress(0);
    abortRef.current = new AbortController();
    try {
      onAudioProcessed(await work(abortRef.current.signal));
    } catch (err) {
      if (err instanceof DOMException && err.name === 'AbortError') return;
      setError(errorMessage(err, fallback));
      setProcessing(false);
    }
  };

  const handleBackgroundMusic = () => {
    if (!musicFile) return;
    void run(async (signal) => {
      setStep('Uploading music…');
      setProgress(10);
      const finalJobId = await addBackgroundMusic(jobId, musicFile);
      setStep('Mixing music into the video…');
      await waitForJob('video', finalJobId, {
        signal,
        onUpdate: (job) => setProgress(30 + job.progress * 0.7),
      });
      return finalJobId;
    }, 'Failed to add background music.');
  };

  const handleNarration = () => {
    const text = description.trim();
    if (!text) return;
    void run(async (signal) => {
      setStep('Writing the narration script…');
      setProgress(10);
      const script = await generateScript(jobId, text);

      setStep('Generating speech…');
      setProgress(35);
      const audioJobId = await generateAudio(jobId, script);
      await waitForJob('audio', audioJobId, { signal });

      setStep('Adding narration to the video…');
      setProgress(70);
      const finalJobId = await mixNarration(jobId, audioJobId);
      await waitForJob('video', finalJobId, {
        signal,
        onUpdate: (job) => setProgress(70 + job.progress * 0.3),
      });
      return finalJobId;
    }, 'Failed to generate narration.');
  };

  const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0] ?? null;
    if (file && !isSupportedAudioFile(file)) {
      setError('Please choose an MP3, WAV, OGG, M4A or AAC file.');
      setMusicFile(null);
      event.target.value = '';
      return;
    }
    setError(null);
    setMusicFile(file);
  };

  if (processing) {
    return (
      <section
        className="audio-processor processing"
        aria-labelledby="audio-heading"
        aria-busy="true"
      >
        <h2 id="audio-heading">Adding audio to your video</h2>
        <ProgressBar value={progress} label="Audio processing" />
        <p className="progress-step" aria-live="polite">
          {step}
        </p>
      </section>
    );
  }

  return (
    <section className="audio-processor" aria-labelledby="audio-heading">
      <h2 id="audio-heading">Add audio to your video</h2>
      <p>Your slideshow is ready. Optionally add music or an AI-generated narration.</p>

      <ErrorMessage message={error} />

      <div className="audio-options">
        <div className={`audio-option ${option === 'background-music' ? 'selected' : ''}`}>
          <label className="option-header">
            <input
              type="radio"
              name="audioOption"
              value="background-music"
              checked={option === 'background-music'}
              onChange={() => setOption('background-music')}
            />
            <span className="option-title">🎵 Background music</span>
          </label>
          <p>Add your own music track. It loops if shorter than the video.</p>

          {option === 'background-music' && (
            <div className="option-details">
              <div className="file-upload">
                <label htmlFor="music-file" className="file-label">
                  Music file
                </label>
                <input
                  id="music-file"
                  type="file"
                  accept=".mp3,.wav,.ogg,.m4a,.aac,audio/*"
                  onChange={handleFileChange}
                  className="file-input"
                />
                {musicFile && <div className="selected-file">Selected: {musicFile.name}</div>}
              </div>
              <button
                type="button"
                onClick={handleBackgroundMusic}
                disabled={!musicFile}
                className="process-button"
              >
                Add background music
              </button>
            </div>
          )}
        </div>

        <div className={`audio-option ${option === 'ai-dubbing' ? 'selected' : ''}`}>
          <label className="option-header">
            <input
              type="radio"
              name="audioOption"
              value="ai-dubbing"
              checked={option === 'ai-dubbing'}
              onChange={() => setOption('ai-dubbing')}
            />
            <span className="option-title">🎙️ AI narration</span>
          </label>
          <p>
            Describe the slideshow and get a generated voice-over (requires API keys on the server).
          </p>

          {option === 'ai-dubbing' && (
            <div className="option-details">
              <div className="description-input">
                <label htmlFor="video-description">Describe your video</label>
                <textarea
                  id="video-description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="What is the slideshow about, what mood should it have, and what should the narration convey?"
                  rows={4}
                  maxLength={1000}
                  className="description-textarea"
                  aria-describedby="description-hint"
                />
                <small id="description-hint" className="input-hint">
                  {description.length}/1000 characters
                </small>
              </div>
              <button
                type="button"
                onClick={handleNarration}
                disabled={!description.trim()}
                className="process-button"
              >
                Generate narration
              </button>
            </div>
          )}
        </div>
      </div>

      <div className="action-buttons">
        <button type="button" onClick={onSkip} className="skip-button">
          Skip – use the video without audio
        </button>
      </div>
    </section>
  );
}
