import React, { useRef, useState } from 'react';
import { Upload, X, Image } from 'lucide-react';

interface LogoUploaderProps {
  logo: File | null;
  onLogoChange: (file: File | null) => void;
}

const LogoUploader: React.FC<LogoUploaderProps> = ({ logo, onLogoChange }) => {
  const [dragOver, setDragOver] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (file: File) => {
    if (file && file.type.startsWith('image/')) {
      onLogoChange(file);
      
      // Create preview URL
      const reader = new FileReader();
      reader.onload = (e) => {
        setPreviewUrl(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    
    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0) {
      handleFileSelect(files[0]);
    }
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length > 0) {
      handleFileSelect(files[0]);
    }
  };

  const removeLogo = () => {
    onLogoChange(null);
    setPreviewUrl(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6 mb-6">
      <h2 className="text-2xl font-bold text-gray-800 mb-4">Upload University Logo</h2>
      
      {!logo ? (
        <div
          className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
            dragOver
              ? 'border-blue-500 bg-blue-50'
              : 'border-gray-300 bg-gray-50 hover:border-gray-400 hover:bg-gray-100'
          }`}
          onDrop={handleDrop}
          onDragOver={(e) => {
            e.preventDefault();
            setDragOver(true);
          }}
          onDragLeave={() => setDragOver(false)}
        >
          <div className="flex flex-col items-center space-y-4">
            <div className="p-4 bg-white rounded-full shadow-sm">
              <Upload className="w-8 h-8 text-gray-400" />
            </div>
            
            <div>
              <p className="text-lg font-medium text-gray-600">
                Drop your logo here, or{' '}
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="text-blue-600 hover:text-blue-700 underline"
                >
                  browse
                </button>
              </p>
              <p className="text-sm text-gray-400 mt-1">
                Supports: PNG, JPG, GIF (Max 5MB)
              </p>
            </div>
          </div>
          
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleFileInput}
            className="hidden"
          />
        </div>
      ) : (
        <div className="border border-gray-200 rounded-lg p-4">
          <div className="flex items-start space-x-4">
            {previewUrl ? (
              <img
                src={previewUrl}
                alt="Logo preview"
                className="w-20 h-20 object-contain rounded-lg border border-gray-200 bg-white"
              />
            ) : (
              <div className="w-20 h-20 flex items-center justify-center bg-gray-100 rounded-lg border border-gray-200">
                <Image className="w-8 h-8 text-gray-400" />
              </div>
            )}
            
            <div className="flex-1">
              <h3 className="font-medium text-gray-800">{logo.name}</h3>
              <p className="text-sm text-gray-500">
                {(logo.size / 1024 / 1024).toFixed(2)} MB
              </p>
              <p className="text-sm text-green-600 mt-1">✓ Logo uploaded successfully</p>
            </div>
            
            <button
              onClick={removeLogo}
              className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>
      )}
      
      <div className="mt-4 text-sm text-gray-600">
        <p className="font-medium mb-1">Tips for best results:</p>
        <ul className="list-disc list-inside space-y-1 text-gray-500">
          <li>Use a high-resolution logo (minimum 300x300px)</li>
          <li>Transparent background (PNG) works best</li>
          <li>Simple, clean logos work better than complex designs</li>
        </ul>
      </div>
    </div>
  );
};

export default LogoUploader;