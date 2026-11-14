import { useCallback, useEffect, useRef, useState } from 'react';
import { Check, Clapperboard } from 'lucide-react';
import AudioProcessor from './components/AudioProcessor';
import ImageUploader from './components/ImageUploader';
import NotFound from './components/NotFound';
import ThemeToggle from './components/ThemeToggle';
import VideoDownloader from './components/VideoDownloader';
import VideoProcessor from './components/VideoProcessor';
import type { UploadedFile } from './types';
import './App.css';

type Step =
  | { name: 'upload' }
  | { name: 'configure'; files: UploadedFile[] }
  | { name: 'audio'; files: UploadedFile[]; videoJobId: string }
  | { name: 'done'; finalJobId: string };

const STEP_LABELS = ['Upload', 'Create', 'Audio', 'Download'] as const;
const STEP_INDEX: Record<Step['name'], number> = { upload: 0, configure: 1, audio: 2, done: 3 };
const APP_NAME = 'Photo to Video Converter';

/** The app has a single page; any other path (served by the SPA fallback) is a 404. */
function isKnownPath(): boolean {
  const base = import.meta.env.BASE_URL;
  const rest = window.location.pathname.startsWith(base)
    ? window.location.pathname.slice(base.length)
    : window.location.pathname;
  return rest === '' || rest === 'index.html';
}

function App() {
  const [step, setStep] = useState<Step>({ name: 'upload' });
  const [known] = useState(isKnownPath);
  const reset = useCallback(() => setStep({ name: 'upload' }), []);
  const current = STEP_INDEX[step.name];

  useEffect(() => {
    document.title = known
      ? `${STEP_LABELS[current]} · ${APP_NAME}`
      : `Page not found · ${APP_NAME}`;
  }, [current, known]);

  // After a step change, move focus to the new step's heading so keyboard and
  // screen-reader users follow along (but not on first load).
  const firstRender = useRef(true);
  useEffect(() => {
    if (firstRender.current) {
      firstRender.current = false;
      return;
    }
    document.querySelector<HTMLElement>('main h2')?.focus();
  }, [step.name]);

  return (
    <div className="app">
      <a className="skip-link" href="#main">
        Skip to content
      </a>
      <header className="topbar">
        <div className="container topbar-inner">
          <a className="brand" href={import.meta.env.BASE_URL}>
            <span className="brand-mark" aria-hidden="true">
              <Clapperboard size={18} />
            </span>
            Photo to Video
          </a>
          <ThemeToggle />
        </div>
        <div className="container hero">
          <h1>Turn photos into a video</h1>
          <p>Upload images, get an MP4 slideshow with cross-fades, then add music or narration.</p>
          {known && (
            <ol className="steps" aria-label="Progress">
              {STEP_LABELS.map((label, index) => {
                const state = index === current ? 'active' : index < current ? 'done' : '';
                return (
                  <li
                    key={label}
                    className={`step ${state}`}
                    aria-current={index === current ? 'step' : undefined}
                  >
                    <span className="step-dot" aria-hidden="true">
                      {index < current ? <Check size={16} strokeWidth={3} /> : index + 1}
                    </span>
                    <span>
                      {label}
                      {index < current && <span className="visually-hidden"> (completed)</span>}
                    </span>
                  </li>
                );
              })}
            </ol>
          )}
        </div>
      </header>

      <main id="main" className="app-main container" tabIndex={-1}>
        {!known && <NotFound />}

        {known && step.name === 'upload' && (
          <ImageUploader onFilesUploaded={(files) => setStep({ name: 'configure', files })} />
        )}

        {known && step.name === 'configure' && (
          <VideoProcessor
            files={step.files}
            onVideoCompleted={(videoJobId) =>
              setStep({ name: 'audio', files: step.files, videoJobId })
            }
            onReset={reset}
          />
        )}

        {known && step.name === 'audio' && (
          <AudioProcessor
            jobId={step.videoJobId}
            onAudioProcessed={(finalJobId) => setStep({ name: 'done', finalJobId })}
            onSkip={() => setStep({ name: 'done', finalJobId: step.videoJobId })}
          />
        )}

        {known && step.name === 'done' && (
          <VideoDownloader jobId={step.finalJobId} onReset={reset} />
        )}
      </main>

      <footer className="app-footer">
        <div className="container">
          Videos are rendered with FFmpeg on your own server. Uploaded files stay there.
        </div>
      </footer>
    </div>
  );
}

export default App;
