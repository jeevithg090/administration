import { useCallback, useState } from 'react';
import AudioProcessor from './components/AudioProcessor';
import ImageUploader from './components/ImageUploader';
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

function App() {
  const [step, setStep] = useState<Step>({ name: 'upload' });
  const reset = useCallback(() => setStep({ name: 'upload' }), []);
  const current = STEP_INDEX[step.name];

  return (
    <div className="app">
      <header className="app-header">
        <h1>Photo to Video Converter</h1>
        <p>Upload your images and create a slideshow video with optional music or narration</p>
        <ol className="steps" aria-label="Progress">
          {STEP_LABELS.map((label, index) => (
            <li
              key={label}
              className={index === current ? 'active' : index < current ? 'done' : undefined}
              aria-current={index === current ? 'step' : undefined}
            >
              {label}
            </li>
          ))}
        </ol>
      </header>

      <main className="app-main">
        {step.name === 'upload' && (
          <ImageUploader onFilesUploaded={(files) => setStep({ name: 'configure', files })} />
        )}

        {step.name === 'configure' && (
          <VideoProcessor
            files={step.files}
            onVideoCompleted={(videoJobId) =>
              setStep({ name: 'audio', files: step.files, videoJobId })
            }
            onReset={reset}
          />
        )}

        {step.name === 'audio' && (
          <AudioProcessor
            jobId={step.videoJobId}
            onAudioProcessed={(finalJobId) => setStep({ name: 'done', finalJobId })}
            onSkip={() => setStep({ name: 'done', finalJobId: step.videoJobId })}
          />
        )}

        {step.name === 'done' && <VideoDownloader jobId={step.finalJobId} onReset={reset} />}
      </main>
    </div>
  );
}

export default App;
