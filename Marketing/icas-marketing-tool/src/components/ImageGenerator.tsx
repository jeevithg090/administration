import React, { useState } from 'react';
import { Wand2, Download, Loader } from 'lucide-react';
import type { Festival, AspectRatio, ImageModel } from '../types';
import { generateImagePrompt, generateMultipleImages } from '../utils/api';

interface ImageGeneratorProps {
  postType: string;
  festival?: Festival;
  customText: string;
  logo: File | null;
  aspectRatios: AspectRatio[];
  selectedModel: ImageModel;
}

interface GeneratedImage {
  aspectRatio: AspectRatio;
  imageUrl: string;
  prompt: string;
  model: string;
}

const ImageGenerator: React.FC<ImageGeneratorProps> = ({
  postType,
  festival,
  customText,
  logo,
  aspectRatios,
  selectedModel
}) => {
  const [generatedImages, setGeneratedImages] = useState<GeneratedImage[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [progress, setProgress] = useState<string>('');

  const canGenerate = () => {
    if (aspectRatios.length === 0) return false;
    if (postType === 'event' && !festival) return false;
    if ((postType === 'advertisement' || postType === 'announcement') && !customText.trim()) return false;
    return true;
  };

  const handleGenerate = async () => {
    if (!canGenerate()) return;

    setIsGenerating(true);
    setError(null);
    setGeneratedImages([]);
    setProgress('Initializing...');

    try {
      setProgress('Generating AI prompt...');
      
      // Generate the initial prompt for the first aspect ratio
      const basePrompt = await generateImagePrompt({
        festival,
        universityName: 'ICAS Manipal',
        postType: postType as 'event' | 'advertisement' | 'announcement',
        customText,
        aspectRatio: aspectRatios[0],
        imageModel: selectedModel
      });
      
      console.log('Generated prompt:', basePrompt);
      setProgress(`Creating social media posts with ${selectedModel.name}...`);

      // Generate images for all selected aspect ratios
      const results = await generateMultipleImages(basePrompt, aspectRatios, selectedModel);
      
      if (results && results.length > 0) {
        setGeneratedImages(results);
        setProgress('');
        console.log('Image generation completed successfully!');
      } else {
        throw new Error('No images were generated - all generation methods failed');
      }
      
    } catch (err) {
      console.error('Generation error:', err);
      
      // Enhanced error handling with specific error types
      let errorMessage = 'Failed to generate images';
      
      if (err instanceof Error) {
        errorMessage = err.message;
        
        // Handle specific error types
        if (errorMessage.includes('rate limit') || errorMessage.includes('429')) {
          errorMessage = 'API rate limit reached. Please wait a moment and try again, or switch to Local Canvas model.';
        } else if (errorMessage.includes('401') || errorMessage.includes('unauthorized')) {
          errorMessage = 'API authentication failed. Please check your API keys or use the Local Canvas model.';
        } else if (errorMessage.includes('timeout') || errorMessage.includes('network')) {
          errorMessage = 'Network timeout. Please check your internet connection and try again.';
        } else if (errorMessage.includes('quota') || errorMessage.includes('billing')) {
          errorMessage = 'API quota exceeded. Please upgrade your plan or use the Local Canvas model.';
        } else if (errorMessage.includes('model not found') || errorMessage.includes('404')) {
          errorMessage = 'The selected AI model is currently unavailable. Please try the Local Canvas model.';
        }
      }
      
      setError(errorMessage);
      setProgress('');
      
      // Attempt to generate at least one fallback image
      try {
        console.log('Attempting fallback generation...');
        setProgress('Generating fallback images...');
        
        // Force local canvas generation as fallback
        const fallbackResults = await generateMultipleImages(
          `Professional ${postType} post for ICAS Manipal university with festive design`,
          aspectRatios.slice(0, 1), // Just generate one image as fallback
          { id: 'canvas-local', name: 'Local Canvas', description: 'Fallback', provider: 'local', features: [] }
        );
        
        if (fallbackResults && fallbackResults.length > 0) {
          setGeneratedImages(fallbackResults);
          setError(errorMessage + ' However, we generated a fallback image for you.');
        }
      } catch (fallbackError) {
        console.error('Even fallback failed:', fallbackError);
        // Keep the original error message
      }
      
      setProgress('');
    } finally {
      setIsGenerating(false);
    }
  };

  const downloadImage = async (imageUrl: string, aspectRatio: AspectRatio) => {
    try {
      console.log('Downloading image:', imageUrl);
      
      if (imageUrl.startsWith('data:')) {
        // Handle data URLs (canvas generated images)
        const link = document.createElement('a');
        link.href = imageUrl;
        link.download = `icas-post-${aspectRatio.id.replace(':', 'x')}-${Date.now()}.png`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        return;
      }
      
      if (imageUrl.startsWith('blob:')) {
        // Handle blob URLs
        const link = document.createElement('a');
        link.href = imageUrl;
        link.download = `icas-post-${aspectRatio.id.replace(':', 'x')}-${Date.now()}.jpg`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        return;
      }
      
      // Handle external URLs with CORS proxy
      try {
        const response = await fetch(imageUrl, {
          mode: 'cors',
          headers: {
            'Accept': 'image/*'
          }
        });
        
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}`);
        }
        
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        
        const link = document.createElement('a');
        link.href = url;
        link.download = `icas-post-${aspectRatio.id.replace(':', 'x')}-${Date.now()}.jpg`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);
      } catch (corsError) {
        console.log('Direct download failed, trying alternative method...');
        
        // Fallback: Open image in new tab for manual download
        const newWindow = window.open(imageUrl, '_blank');
        if (!newWindow) {
          // If popup blocked, copy URL to clipboard
          navigator.clipboard.writeText(imageUrl).then(() => {
            alert('Image URL copied to clipboard. You can paste it in a new tab to download the image.');
          }).catch(() => {
            alert(`Right-click to save image: ${imageUrl}`);
          });
        }
      }
    } catch (error) {
      console.error('Failed to download image:', error);
      
      // Fallback: Copy URL to clipboard or show URL
      try {
        await navigator.clipboard.writeText(imageUrl);
        alert('Download failed, but image URL copied to clipboard. You can paste it in a new tab to view/download the image.');
      } catch (clipboardError) {
        alert(`Download failed. You can manually access the image at: ${imageUrl}`);
      }
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <h2 className="text-2xl font-bold text-gray-800 mb-4">Generate Social Media Posts</h2>
      
      {/* Generation Summary */}
      <div className="bg-gray-50 rounded-lg p-4 mb-6">
        <h3 className="font-medium text-gray-800 mb-2">Generation Summary:</h3>
        <div className="space-y-1 text-sm text-gray-600">
          <p><strong>Type:</strong> {postType}</p>
          {festival && <p><strong>Festival:</strong> {festival.name}</p>}
          {customText && <p><strong>Message:</strong> {customText.slice(0, 100)}{customText.length > 100 ? '...' : ''}</p>}
          <p><strong>Formats:</strong> {aspectRatios.map(r => r.name).join(', ')}</p>
          <p><strong>Logo:</strong> {logo ? `✓ ${logo.name}` : '✗ No logo uploaded'}</p>
          <p><strong>Model:</strong> {selectedModel.name} ({selectedModel.provider.toUpperCase()})</p>
        </div>
      </div>

      {/* Generate Button */}
      <div className="text-center mb-6">
        <button
          onClick={handleGenerate}
          disabled={!canGenerate() || isGenerating}
          className={`inline-flex items-center space-x-2 px-8 py-3 rounded-lg font-medium transition-all duration-200 ${
            canGenerate() && !isGenerating
              ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white hover:from-blue-700 hover:to-purple-700 shadow-lg hover:shadow-xl'
              : 'bg-gray-300 text-gray-500 cursor-not-allowed'
          }`}
        >
          {isGenerating ? (
            <>
              <Loader className="w-5 h-5 animate-spin" />
              <span>{progress || 'Generating...'}</span>
            </>
          ) : (
            <>
              <Wand2 className="w-5 h-5" />
              <span>Generate Posts</span>
            </>
          )}
        </button>
      </div>

      {/* Progress Indicator */}
      {isGenerating && progress && (
        <div className="text-center mb-4">
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
            <div className="flex items-center justify-center space-x-2">
              <Loader className="w-4 h-4 animate-spin text-blue-600" />
              <span className="text-blue-700 text-sm font-medium">{progress}</span>
            </div>
          </div>
        </div>
      )}

      {/* Error Message */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
          <p className="text-red-700">{error}</p>
        </div>
      )}

      {/* Requirements Check */}
      {!canGenerate() && !isGenerating && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
          <h3 className="font-medium text-yellow-800 mb-2">Required:</h3>
          <ul className="text-yellow-700 text-sm space-y-1">
            {aspectRatios.length === 0 && <li>• Select at least one aspect ratio</li>}
            {postType === 'event' && !festival && <li>• Choose a festival to celebrate</li>}
            {(postType === 'advertisement' || postType === 'announcement') && !customText.trim() && (
              <li>• Enter your message text</li>
            )}
          </ul>
        </div>
      )}

      {/* Generated Images */}
      {generatedImages.length > 0 && (
        <div className="space-y-6">
          <h3 className="text-xl font-bold text-gray-800">Generated Posts</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {generatedImages.map((image, index) => (
              <div key={index} className="bg-gray-50 rounded-lg p-4">
                <div className="aspect-square mb-4 bg-white rounded-lg overflow-hidden shadow-sm relative">
                  <img
                    src={image.imageUrl}
                    alt={`Generated post - ${image.aspectRatio.name}`}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      console.error('Image failed to load:', image.imageUrl);
                      const target = e.target as HTMLImageElement;
                      // Show error placeholder
                      target.src = `data:image/svg+xml,${encodeURIComponent(`
                        <svg width="${image.aspectRatio.width}" height="${image.aspectRatio.height}" xmlns="http://www.w3.org/2000/svg">
                          <rect width="100%" height="100%" fill="#f3f4f6"/>
                          <text x="50%" y="50%" text-anchor="middle" dy=".3em" fill="#6b7280" font-family="Arial, sans-serif" font-size="16">
                            Failed to load image
                          </text>
                        </svg>
                      `)}`;
                    }}
                    onLoad={() => {
                      console.log('Image loaded successfully:', image.imageUrl);
                    }}
                  />
                  {/* Loading indicator overlay */}
                  <div 
                    className="absolute inset-0 bg-gray-200 flex items-center justify-center"
                    style={{ display: 'none' }}
                    id={`loading-${index}`}
                  >
                    <Loader className="w-8 h-8 animate-spin text-gray-500" />
                  </div>
                </div>
                
                <div className="space-y-3">
                  <div>
                    <h4 className="font-medium text-gray-800">{image.aspectRatio.name}</h4>
                    <p className="text-sm text-gray-500">{image.aspectRatio.description}</p>
                    <p className="text-xs text-gray-400">
                      {image.aspectRatio.width} × {image.aspectRatio.height}
                    </p>
                    <p className="text-xs text-blue-600 font-medium mt-1">
                      Generated with: {image.model}
                    </p>
                  </div>
                  
                  <button
                    onClick={() => downloadImage(image.imageUrl, image.aspectRatio)}
                    className="w-full flex items-center justify-center space-x-2 bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    <Download className="w-4 h-4" />
                    <span>Download</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
          
          <div className="bg-green-50 rounded-lg p-4">
            <p className="text-green-700 text-sm">
              ✓ {generatedImages.length} post{generatedImages.length > 1 ? 's' : ''} generated successfully! 
              Your images are ready for social media.
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

export default ImageGenerator;