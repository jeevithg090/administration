import {
  useEffect,
  useRef,
  useState,
  type ChangeEvent,
  type DragEvent,
  type KeyboardEvent,
} from 'react';
import { ImagePlus, Loader2, Upload, X } from 'lucide-react';
import { errorMessage, uploadImages } from '../lib/api';
import { formatFileSize } from '../lib/format';
import type { UploadedFile } from '../types';
import ErrorMessage from './ErrorMessage';

const MAX_FILES = 20;
const MAX_BYTES = 10 * 1024 * 1024;
const ACCEPTED = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];

interface ImageUploaderProps {
  onFilesUploaded: (files: UploadedFile[]) => void;
}

interface SelectedImage {
  file: File;
  previewUrl: string;
}

export default function ImageUploader({ onFilesUploaded }: ImageUploaderProps) {
  const [selected, setSelected] = useState<SelectedImage[]>([]);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Keep the latest selection in a ref so object URLs can be released on unmount.
  const selectedRef = useRef(selected);
  useEffect(() => {
    selectedRef.current = selected;
  }, [selected]);
  useEffect(
    () => () => selectedRef.current.forEach((image) => URL.revokeObjectURL(image.previewUrl)),
    [],
  );

  const addFiles = (fileList: FileList | null) => {
    if (!fileList) return;
    const files = Array.from(fileList);
    const valid = files.filter((file) => ACCEPTED.includes(file.type) && file.size <= MAX_BYTES);
    const skipped = files.length - valid.length;

    setSelected((previous) => {
      const room = MAX_FILES - previous.length;
      const added = valid.slice(0, Math.max(0, room)).map((file) => ({
        file,
        previewUrl: URL.createObjectURL(file),
      }));
      const problems: string[] = [];
      if (skipped > 0)
        problems.push(
          `${skipped} file${skipped === 1 ? ' was' : 's were'} skipped: only JPG, PNG, GIF or WebP images up to 10 MB are supported.`,
        );
      if (valid.length > room) problems.push(`You can add at most ${MAX_FILES} images.`);
      setError(problems.length ? problems.join(' ') : null);
      return [...previous, ...added];
    });
  };

  const openPicker = () => {
    if (!uploading) fileInputRef.current?.click();
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      openPicker();
    }
  };

  const handleDrop = (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setDragOver(false);
    if (!uploading) addFiles(event.dataTransfer.files);
  };

  const handleInputChange = (event: ChangeEvent<HTMLInputElement>) => {
    addFiles(event.target.files);
    event.target.value = '';
  };

  const removeFile = (index: number) => {
    URL.revokeObjectURL(selected[index].previewUrl);
    setSelected((previous) => previous.filter((_, i) => i !== index));
  };

  const clearAll = () => {
    selected.forEach((image) => URL.revokeObjectURL(image.previewUrl));
    setSelected([]);
    setError(null);
  };

  const handleUpload = async () => {
    if (selected.length === 0) return;
    setUploading(true);
    setError(null);
    try {
      onFilesUploaded(await uploadImages(selected.map((image) => image.file)));
    } catch (err) {
      setError(errorMessage(err, 'Failed to upload files. Please try again.'));
      setUploading(false);
    }
  };

  const hasFiles = selected.length > 0;
  const full = selected.length >= MAX_FILES;
  const totalSize = selected.reduce((sum, image) => sum + image.file.size, 0);

  return (
    <section className="card" aria-labelledby="upload-heading">
      <div className="card-header">
        <h2 id="upload-heading" tabIndex={-1}>
          Choose your photos
        </h2>
        <p>They appear in the video in the order you add them.</p>
      </div>

      <div className="stack">
        {!full && (
          <div
            className={`drop-zone ${dragOver ? 'drag-over' : ''} ${hasFiles ? 'compact' : ''}`}
            role="button"
            tabIndex={0}
            aria-label={hasFiles ? 'Add more images' : 'Choose images to upload'}
            aria-describedby="drop-zone-hint"
            aria-disabled={uploading}
            onClick={openPicker}
            onKeyDown={handleKeyDown}
            onDrop={handleDrop}
            onDragOver={(event) => {
              event.preventDefault();
              setDragOver(true);
            }}
            onDragLeave={() => setDragOver(false)}
          >
            <input
              ref={fileInputRef}
              type="file"
              multiple
              accept={ACCEPTED.join(',')}
              onChange={handleInputChange}
              hidden
            />
            <span className="drop-zone-icon" aria-hidden="true">
              {hasFiles ? <ImagePlus size={20} /> : <Upload size={24} />}
            </span>
            <div>
              <p className="drop-zone-title">
                {hasFiles ? (
                  'Add more images'
                ) : (
                  <>
                    Drop images here or <span className="link-text">browse</span>
                  </>
                )}
              </p>
              <p id="drop-zone-hint" className="drop-zone-hint">
                JPG, PNG, GIF or WebP · up to {MAX_FILES} images · 10 MB each
              </p>
            </div>
          </div>
        )}

        <ErrorMessage message={error} />

        {hasFiles && (
          <div>
            <div className="list-header">
              <h3 className="section-title">
                {selected.length} of {MAX_FILES} images · {formatFileSize(totalSize)}
              </h3>
              <button
                type="button"
                className="btn btn-ghost"
                onClick={clearAll}
                disabled={uploading}
              >
                Clear all
              </button>
            </div>
            <ul className="thumb-grid">
              {selected.map(({ file, previewUrl }, index) => (
                <li key={previewUrl} className="thumb">
                  <img src={previewUrl} alt="" />
                  <span className="thumb-index" aria-hidden="true">
                    {index + 1}
                  </span>
                  <button
                    type="button"
                    onClick={() => removeFile(index)}
                    className="thumb-remove"
                    aria-label={`Remove ${file.name}`}
                    disabled={uploading}
                  >
                    <X size={16} aria-hidden />
                  </button>
                  <div className="thumb-meta">
                    <span className="thumb-name" title={file.name}>
                      {file.name}
                    </span>
                    <span className="thumb-size">{formatFileSize(file.size)}</span>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>

      <div className="actions">
        <span className="field-hint spacer">
          {hasFiles ? 'Next: choose timing and quality.' : 'Add at least one image to continue.'}
        </span>
        <button
          type="button"
          onClick={handleUpload}
          disabled={uploading || !hasFiles}
          aria-busy={uploading}
          className="btn btn-primary"
        >
          {uploading && <Loader2 size={18} className="spin" aria-hidden />}
          {uploading
            ? 'Uploading…'
            : hasFiles
              ? `Upload ${selected.length} image${selected.length === 1 ? '' : 's'}`
              : 'Upload images'}
        </button>
      </div>
    </section>
  );
}
