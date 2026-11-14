import { useRef, useState, type ChangeEvent, type DragEvent } from 'react';
import { Upload, X } from 'lucide-react';
import { useObjectUrl } from '../hooks/useObjectUrl';

const MAX_BYTES = 5 * 1024 * 1024;

interface LogoUploaderProps {
  logo: File | null;
  onLogoChange: (file: File | null) => void;
}

const LogoUploader = ({ logo, onLogoChange }: LogoUploaderProps) => {
  const [dragOver, setDragOver] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const previewUrl = useObjectUrl(logo);

  const handleFile = (file: File | undefined) => {
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      setError('Please choose an image file (PNG, JPG, SVG or WebP).');
      return;
    }
    if (file.size > MAX_BYTES) {
      setError('The logo must be 5 MB or smaller.');
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

  return (
    <section className="bg-white rounded-lg shadow-md p-6 mb-6" aria-labelledby="logo-heading">
      <h2 id="logo-heading" className="text-2xl font-bold text-gray-800 mb-1">
        Logo <span className="text-base font-normal text-gray-500">(optional)</span>
      </h2>
      <p className="text-gray-600 mb-4">
        Your logo is placed in the top-right corner of every post.
      </p>

      {!logo || !previewUrl ? (
        <div
          className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
            dragOver
              ? 'border-blue-500 bg-blue-50'
              : 'border-gray-300 bg-gray-50 hover:border-gray-400 hover:bg-gray-100'
          }`}
          onDrop={handleDrop}
          onDragOver={(event) => {
            event.preventDefault();
            setDragOver(true);
          }}
          onDragLeave={() => setDragOver(false)}
        >
          <div className="flex flex-col items-center gap-4">
            <div className="p-4 bg-white rounded-full shadow-sm" aria-hidden="true">
              <Upload className="w-8 h-8 text-gray-400" />
            </div>
            <div>
              <p className="text-lg font-medium text-gray-600">
                Drop your logo here, or{' '}
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="text-blue-600 hover:text-blue-700 underline"
                >
                  browse
                </button>
              </p>
              <p className="text-sm text-gray-500 mt-1">PNG, JPG, SVG or WebP · max 5 MB</p>
            </div>
          </div>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleInput}
            className="hidden"
            aria-label="Logo file"
          />
        </div>
      ) : (
        <div className="border border-gray-200 rounded-lg p-4 flex items-start gap-4">
          <img
            src={previewUrl}
            alt="Logo preview"
            className="w-20 h-20 object-contain rounded-lg border border-gray-200 bg-white"
          />
          <div className="flex-1 min-w-0">
            <p className="font-medium text-gray-800 break-all">{logo.name}</p>
            <p className="text-sm text-gray-500">{(logo.size / 1024).toFixed(0)} KB</p>
          </div>
          <button
            type="button"
            onClick={() => onLogoChange(null)}
            className="p-2 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
            aria-label="Remove logo"
          >
            <X className="w-5 h-5" aria-hidden="true" />
          </button>
        </div>
      )}

      {error && (
        <p className="mt-3 text-sm text-red-700" role="alert">
          {error}
        </p>
      )}

      <div className="mt-4 text-sm text-gray-600">
        <p className="font-medium mb-1">Tips for best results:</p>
        <ul className="list-disc list-inside space-y-1 text-gray-500">
          <li>Use a high-resolution logo (at least 300×300 px)</li>
          <li>A transparent PNG or SVG works best</li>
        </ul>
      </div>
    </section>
  );
};

export default LogoUploader;
