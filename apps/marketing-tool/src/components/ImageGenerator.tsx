import { useState } from 'react';
import { AlertTriangle, Download, Loader, Wand2 } from 'lucide-react';
import { useObjectUrl } from '../hooks/useObjectUrl';
import { generatePosts, missingRequirements } from '../lib/generate';
import type { AspectRatio, GeneratedImage, ImageModel, PostRequest } from '../types';

interface ImageGeneratorProps {
  request: PostRequest;
  logo: File | null;
  aspectRatios: AspectRatio[];
  selectedModel: ImageModel;
}

function fileName(image: GeneratedImage, index: number): string {
  const ext = image.imageUrl.startsWith('data:image/svg') ? 'svg' : 'png';
  return `post-${image.aspectRatio.id.replace(':', 'x')}-${index + 1}.${ext}`;
}

const ImageGenerator = ({ request, logo, aspectRatios, selectedModel }: ImageGeneratorProps) => {
  const [images, setImages] = useState<GeneratedImage[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [progress, setProgress] = useState('');
  const [error, setError] = useState<string | null>(null);
  const logoUrl = useObjectUrl(logo);

  const missing = missingRequirements(request, aspectRatios);
  const canGenerate = missing.length === 0 && !isGenerating;

  const handleGenerate = async () => {
    if (!canGenerate) return;
    setIsGenerating(true);
    setError(null);
    setImages([]);
    try {
      const results = await generatePosts({
        request,
        aspectRatios,
        model: selectedModel,
        logoUrl: logoUrl ?? undefined,
        onProgress: setProgress,
      });
      setImages(results);
    } catch (err) {
      console.error('Generation failed:', err);
      setError(err instanceof Error ? err.message : 'Failed to generate posts.');
    } finally {
      setIsGenerating(false);
      setProgress('');
    }
  };

  const fallbacks = images.filter((image) => image.fallbackReason);

  return (
    <section className="bg-white rounded-lg shadow-md p-6" aria-labelledby="generate-heading">
      <h2 id="generate-heading" className="text-2xl font-bold text-gray-800 mb-4">
        Generate Social Media Posts
      </h2>

      <div className="bg-gray-50 rounded-lg p-4 mb-6">
        <h3 className="font-medium text-gray-800 mb-2">Summary</h3>
        <dl className="grid grid-cols-[auto_1fr] gap-x-3 gap-y-1 text-sm text-gray-600">
          <dt className="font-semibold">Type</dt>
          <dd className="capitalize">{request.postType}</dd>
          {request.festival && (
            <>
              <dt className="font-semibold">Festival</dt>
              <dd>{request.festival.name}</dd>
            </>
          )}
          {request.customText && (
            <>
              <dt className="font-semibold">Message</dt>
              <dd className="break-words">{request.customText}</dd>
            </>
          )}
          <dt className="font-semibold">Formats</dt>
          <dd>{aspectRatios.map((r) => r.name).join(', ') || '–'}</dd>
          <dt className="font-semibold">Logo</dt>
          <dd>{logo ? logo.name : 'None'}</dd>
          <dt className="font-semibold">Model</dt>
          <dd>{selectedModel.name}</dd>
        </dl>
      </div>

      {missing.length > 0 && !isGenerating && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
          <h3 className="font-medium text-yellow-800 mb-2">Before you generate:</h3>
          <ul className="text-yellow-800 text-sm list-disc list-inside space-y-1">
            {missing.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </div>
      )}

      <div className="text-center mb-6">
        <button
          type="button"
          onClick={handleGenerate}
          disabled={!canGenerate}
          aria-busy={isGenerating}
          className={`inline-flex items-center gap-2 px-8 py-3 rounded-lg font-medium transition-all duration-200 ${
            canGenerate
              ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white hover:from-blue-700 hover:to-purple-700 shadow-lg hover:shadow-xl'
              : 'bg-gray-300 text-gray-600 cursor-not-allowed'
          }`}
        >
          {isGenerating ? (
            <Loader className="w-5 h-5 animate-spin" aria-hidden="true" />
          ) : (
            <Wand2 className="w-5 h-5" aria-hidden="true" />
          )}
          <span>{isGenerating ? 'Generating…' : 'Generate Posts'}</span>
        </button>
        <p className="mt-3 text-sm text-blue-700 min-h-5" role="status" aria-live="polite">
          {progress}
        </p>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6" role="alert">
          <p className="text-red-700">{error}</p>
        </div>
      )}

      {fallbacks.length > 0 && (
        <div
          className="bg-amber-50 border border-amber-200 rounded-lg p-4 mb-6 flex gap-3"
          role="status"
        >
          <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" aria-hidden="true" />
          <div className="text-sm text-amber-800">
            <p className="font-medium">
              {selectedModel.name} was unavailable for {fallbacks.length} of {images.length} post
              {images.length === 1 ? '' : 's'}, so they were rendered locally instead.
            </p>
            <p className="mt-1">{fallbacks[0].fallbackReason}</p>
          </div>
        </div>
      )}

      {images.length > 0 && (
        <div className="space-y-6">
          <h3 className="text-xl font-bold text-gray-800">Generated Posts</h3>
          <ul className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {images.map((image, index) => (
              <li
                key={`${image.aspectRatio.id}-${index}`}
                className="bg-gray-50 rounded-lg p-4 flex flex-col"
              >
                <div className="mb-4 bg-white rounded-lg overflow-hidden shadow-sm flex items-center justify-center">
                  <img
                    src={image.imageUrl}
                    alt={`Generated ${request.postType} post, ${image.aspectRatio.name}`}
                    className="w-full h-auto object-contain"
                    style={{
                      aspectRatio: `${image.aspectRatio.width} / ${image.aspectRatio.height}`,
                    }}
                  />
                </div>
                <div className="space-y-1 mb-3">
                  <h4 className="font-medium text-gray-800">{image.aspectRatio.name}</h4>
                  <p className="text-sm text-gray-500">{image.aspectRatio.description}</p>
                  <p className="text-xs text-gray-500">
                    {image.aspectRatio.width} × {image.aspectRatio.height} · {image.model}
                  </p>
                </div>
                <a
                  href={image.imageUrl}
                  download={fileName(image, index)}
                  className="mt-auto w-full flex items-center justify-center gap-2 bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors"
                >
                  <Download className="w-4 h-4" aria-hidden="true" />
                  <span>Download</span>
                </a>
              </li>
            ))}
          </ul>
        </div>
      )}
    </section>
  );
};

export default ImageGenerator;
