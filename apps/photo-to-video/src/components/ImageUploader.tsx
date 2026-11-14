import {
  useEffect,
  useRef,
  useState,
  type ChangeEvent,
  type DragEvent,
  type KeyboardEvent,
} from 'react';
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
        problems.push(`${skipped} file(s) skipped (JPG, PNG, GIF or WebP up to 10 MB only).`);
      if (valid.length > room) problems.push(`You can upload at most ${MAX_FILES} images.`);
      setError(problems.length ? problems.join(' ') : null);
      return [...previous, ...added];
    });
  };

  const openPicker = () => fileInputRef.current?.click();

  const handleKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      openPicker();
    }
  };

  const handleDrop = (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setDragOver(false);
    addFiles(event.dataTransfer.files);
  };

  const handleInputChange = (event: ChangeEvent<HTMLInputElement>) => {
    addFiles(event.target.files);
    event.target.value = '';
  };

  const removeFile = (index: number) => {
    URL.revokeObjectURL(selected[index].previewUrl);
    setSelected((previous) => previous.filter((_, i) => i !== index));
  };

  const handleUpload = async () => {
    if (selected.length === 0) return;
    setUploading(true);
    setError(null);
    try {
      onFilesUploaded(await uploadImages(selected.map((image) => image.file)));
    } catch (err) {
      setError(errorMessage(err, 'Failed to upload files. Please try again.'));
    } finally {
      setUploading(false);
    }
  };

  return (
    <section className="image-uploader" aria-labelledby="upload-heading">
      <h2 id="upload-heading" className="visually-hidden">
        Upload images
      </h2>
      <div
        className={`drop-zone ${dragOver ? 'drag-over' : ''}`}
        role="button"
        tabIndex={0}
        aria-describedby="drop-zone-hint"
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
        <div className="drop-zone-content">
          <div className="upload-icon" aria-hidden="true">
            📁
          </div>
          <h3>Drop your images here</h3>
          <p>or click to browse files</p>
          <small id="drop-zone-hint">
            JPG, PNG, GIF or WebP · up to {MAX_FILES} images · max 10 MB each
          </small>
        </div>
      </div>

      <ErrorMessage message={error} />

      {selected.length > 0 && (
        <div className="selected-files">
          <h3>Selected images ({selected.length})</h3>
          <ul className="file-list">
            {selected.map(({ file, previewUrl }, index) => (
              <li key={previewUrl} className="file-item">
                <img src={previewUrl} alt="" className="file-thumb" />
                <div className="file-info">
                  <span className="file-name">{file.name}</span>
                  <span className="file-size">{formatFileSize(file.size)}</span>
                </div>
                <button
                  type="button"
                  onClick={() => removeFile(index)}
                  className="remove-file"
                  aria-label={`Remove ${file.name}`}
                  disabled={uploading}
                >
                  ✕
                </button>
              </li>
            ))}
          </ul>

          <button
            type="button"
            onClick={handleUpload}
            disabled={uploading}
            className="upload-button"
          >
            {uploading
              ? 'Uploading…'
              : `Upload ${selected.length} image${selected.length === 1 ? '' : 's'}`}
          </button>
        </div>
      )}
    </section>
  );
}
