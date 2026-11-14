import { useRef, useState, type ChangeEvent, type DragEvent, type KeyboardEvent } from 'react';
import { ImageUp, X } from 'lucide-react';
import { useObjectUrl } from '../hooks/useObjectUrl';
import Section from './Section';

const MAX_BYTES = 5 * 1024 * 1024;

interface LogoUploaderProps {
  step: number;
  logo: File | null;
  onLogoChange: (file: File | null) => void;
}

const LogoUploader = ({ step, logo, onLogoChange }: LogoUploaderProps) => {
  const [dragOver, setDragOver] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const previewUrl = useObjectUrl(logo);

  const handleFile = (file: File | undefined) => {
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      setError('That file isn’t an image. Choose a PNG, JPG, SVG or WebP file.');
      return;
    }
    if (file.size > MAX_BYTES) {
      setError(`That logo is ${(file.size / 1024 / 1024).toFixed(1)} MB. The limit is 5 MB.`);
      return;
    }
    setError(null);
    onLogoChange(file);
  };

  const handleDrop = (event: DragEvent) => {
    event.preventDefault();
    setDragOver(false);
    handleFile(event.dataTransfer.files[0]);
  };

  const handleInput = (event: ChangeEvent<HTMLInputElement>) => {
    handleFile(event.target.files?.[0]);
    event.target.value = '';
  };

  const openPicker = () => fileInputRef.current?.click();

  const handleKeyDown = (event: KeyboardEvent) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      openPicker();
    }
  };

  return (
    <Section
      id="logo"
      step={step}
      title={
        <>
          Add your logo
          <span className="ml-2 text-sm font-normal text-fg-subtle">optional</span>
        </>
      }
      description="Placed in the top-right corner of every post. A transparent PNG or SVG of at least 300×300 px works best."
    >
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleInput}
        className="sr-only"
        tabIndex={-1}
        aria-hidden="true"
      />

      {!logo || !previewUrl ? (
        <div
          role="button"
          tabIndex={0}
          aria-label="Choose a logo image"
          aria-describedby="logo-hint"
          onClick={openPicker}
          onKeyDown={handleKeyDown}
          onDrop={handleDrop}
          onDragOver={(event) => {
            event.preventDefault();
            setDragOver(true);
          }}
          onDragLeave={() => setDragOver(false)}
          className={`flex flex-col sm:flex-row items-center justify-center gap-4 rounded-xl border-2 border-dashed p-6 text-center sm:text-left transition-colors ${
            dragOver
              ? 'border-brand bg-brand-soft'
              : 'border-line-strong bg-surface-muted hover:border-brand hover:bg-brand-soft'
          }`}
        >
          <span
            className="inline-grid place-items-center size-12 rounded-full bg-surface text-brand shadow-sm"
            aria-hidden="true"
          >
            <ImageUp className="size-6" />
          </span>
          <span>
            <span className="block font-semibold">
              Drop your logo here or{' '}
              <span className="text-brand-fg underline underline-offset-2">browse</span>
            </span>
            <span id="logo-hint" className="block text-sm text-fg-subtle">
              PNG, JPG, SVG or WebP · max 5 MB
            </span>
          </span>
        </div>
      ) : (
        <div className="flex items-center gap-4 rounded-xl border border-line p-3 animate-fade-in">
          <img
            src={previewUrl}
            alt="Your logo"
            className="size-16 object-contain rounded-lg border border-line bg-[repeating-conic-gradient(#e5e7eb_0_25%,#fff_0_50%)] bg-[length:16px_16px]"
          />
          <div className="flex-1 min-w-0">
            <p className="font-medium truncate">{logo.name}</p>
            <p className="text-sm text-fg-subtle">{(logo.size / 1024).toFixed(0)} KB</p>
          </div>
          <button type="button" onClick={openPicker} className="btn-ghost hidden sm:inline-flex">
            Replace
          </button>
          <button
            type="button"
            onClick={() => onLogoChange(null)}
            className="inline-grid place-items-center size-11 rounded-lg text-fg-subtle hover:text-danger-fg hover:bg-danger-soft transition-colors"
            aria-label="Remove logo"
          >
            <X className="size-5" aria-hidden="true" />
          </button>
        </div>
      )}

      {error && (
        <p className="mt-3 text-sm font-medium text-danger-fg" role="alert">
          {error}
        </p>
      )}
    </Section>
  );
};

export default LogoUploader;
