import { useEffect, useRef, useState, type ChangeEvent } from 'react';
import { Loader2, Mic, Music, SkipForward, Wand2 } from 'lucide-react';
import {
  addBackgroundMusic,
  errorMessage,
  generateAudio,
  generateScript,
  getServerFeatures,
  mixNarration,
  waitForJob,
} from '../lib/api';
import { formatFileSize, isSupportedAudioFile } from '../lib/format';
import ErrorMessage from './ErrorMessage';
import ProgressBar from './ProgressBar';

interface AudioProcessorProps {
  jobId: string;
  onAudioProcessed: (finalJobId: string) => void;
  onSkip: () => void;
}

type AudioOption = 'background-music' | 'ai-dubbing';

const MAX_DESCRIPTION = 1000;

export default function AudioProcessor({ jobId, onAudioProcessed, onSkip }: AudioProcessorProps) {
  const [option, setOption] = useState<AudioOption | null>(null);
  const [musicFile, setMusicFile] = useState<File | null>(null);
  const [description, setDescription] = useState('');
  const [processing, setProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [step, setStep] = useState('');
  const [error, setError] = useState<string | null>(null);
  // null while loading; assume available if the check itself fails.
  const [narrationAvailable, setNarrationAvailable] = useState<boolean | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  useEffect(() => () => abortRef.current?.abort(), []);

  useEffect(() => {
    let active = true;
    getServerFeatures()
      .then((features) => active && setNarrationAvailable(features.narration))
      .catch(() => active && setNarrationAvailable(true));
    return () => {
      active = false;
    };
  }, []);

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
      setError('That file type isn’t supported. Choose an MP3, WAV, OGG, M4A or AAC file.');
      setMusicFile(null);
      event.target.value = '';
      return;
    }
    setError(null);
    setMusicFile(file);
  };

  const selectOption = (value: AudioOption) => {
    setOption(value);
    setError(null);
  };

  if (processing) {
    return (
      <section className="card" aria-labelledby="audio-heading" aria-busy="true">
        <div className="status-panel">
          <span className="status-icon" aria-hidden="true">
            <Loader2 size={26} className="spin" />
          </span>
          <h2 id="audio-heading" className="card-title" tabIndex={-1}>
            Adding audio to your video
          </h2>
          <p aria-live="polite">{step}</p>
          <ProgressBar value={progress} label="Audio processing" />
        </div>
      </section>
    );
  }

  const narrationDisabled = narrationAvailable === false;

  return (
    <section className="card" aria-labelledby="audio-heading">
      <div className="card-header">
        <h2 id="audio-heading" tabIndex={-1}>
          Add audio (optional)
        </h2>
        <p>Your slideshow is rendered. Add a soundtrack or a narrated voice-over, or skip ahead.</p>
      </div>

      <div className="stack">
        <fieldset className="choices">
          <legend className="visually-hidden">Audio type</legend>
          <label className="choice">
            <input
              type="radio"
              name="audioOption"
              value="background-music"
              checked={option === 'background-music'}
              onChange={() => selectOption('background-music')}
            />
            <span className="choice-icon" aria-hidden="true">
              <Music size={20} />
            </span>
            <span>
              <span className="choice-title">Background music</span>
              <span className="choice-desc">
                Upload your own track. It loops if it is shorter than the video.
              </span>
            </span>
          </label>

          <label className="choice">
            <input
              type="radio"
              name="audioOption"
              value="ai-dubbing"
              checked={option === 'ai-dubbing'}
              onChange={() => selectOption('ai-dubbing')}
              disabled={narrationDisabled}
              aria-describedby={narrationDisabled ? 'narration-unavailable' : undefined}
            />
            <span className="choice-icon" aria-hidden="true">
              <Mic size={20} />
            </span>
            <span>
              <span className="choice-title">AI narration</span>
              <span className="choice-desc">
                Describe the slideshow; a script is written and read aloud for you.
              </span>
              {narrationDisabled && (
                <span id="narration-unavailable" className="badge">
                  Not configured on this server
                </span>
              )}
            </span>
          </label>
        </fieldset>

        {narrationDisabled && (
          <div className="alert alert-info">
            <span>
              AI narration needs <code>OPENROUTER_API_KEY</code> and <code>ELEVENLABS_API_KEY</code>{' '}
              in the server&apos;s environment. Background music works without any keys.
            </span>
          </div>
        )}

        {option === 'background-music' && (
          <div className="panel">
            <div className="field">
              <label htmlFor="music-file" className="field-label">
                Music file
              </label>
              <input
                id="music-file"
                type="file"
                accept=".mp3,.wav,.ogg,.m4a,.aac,audio/*"
                onChange={handleFileChange}
                className="input file-input"
                aria-describedby="music-hint"
              />
              <small id="music-hint" className="field-hint">
                {musicFile
                  ? `${musicFile.name} · ${formatFileSize(musicFile.size)}`
                  : 'MP3, WAV, OGG, M4A or AAC · up to 25 MB'}
              </small>
            </div>
            <button
              type="button"
              onClick={handleBackgroundMusic}
              disabled={!musicFile}
              className="btn btn-primary"
            >
              <Music size={18} aria-hidden />
              Add background music
            </button>
          </div>
        )}

        {option === 'ai-dubbing' && (
          <div className="panel">
            <div className="field">
              <label htmlFor="video-description" className="field-label">
                Describe your video
              </label>
              <textarea
                id="video-description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="e.g. Highlights from our campus open day: the labs, the library and student projects. Upbeat and welcoming."
                rows={4}
                maxLength={MAX_DESCRIPTION}
                className="textarea"
                aria-describedby="description-hint"
              />
              <small id="description-hint" className="field-hint">
                What it&apos;s about, the mood, and what the narration should say ·{' '}
                {description.length}/{MAX_DESCRIPTION}
              </small>
            </div>
            <button
              type="button"
              onClick={handleNarration}
              disabled={!description.trim()}
              className="btn btn-primary"
            >
              <Wand2 size={18} aria-hidden />
              Generate narration
            </button>
          </div>
        )}

        <ErrorMessage title="Couldn't add audio" message={error} />
      </div>

      <div className="actions">
        <button type="button" onClick={onSkip} className="btn btn-secondary">
          Continue without audio
          <SkipForward size={18} aria-hidden />
        </button>
      </div>
    </section>
  );
}
