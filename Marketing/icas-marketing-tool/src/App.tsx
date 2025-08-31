import React, { useState } from 'react';
import Header from './components/Header';
import PostTypeSelector from './components/PostTypeSelector';
import FestivalSelector from './components/FestivalSelector';
import LogoUploader from './components/LogoUploader';
import CustomTextInput from './components/CustomTextInput';
import AspectRatioSelector from './components/AspectRatioSelector';
import ModelSelector, { AVAILABLE_MODELS } from './components/ModelSelector';
import ImageGenerator from './components/ImageGenerator';
import ErrorBoundary from './components/ErrorBoundary';
import type { Festival, AspectRatio, ImageModel } from './types';
import './App.css';

function App() {
  const [postType, setPostType] = useState<string | null>(null);
  const [selectedFestival, setSelectedFestival] = useState<Festival | null>(null);
  const [customText, setCustomText] = useState<string>('');
  const [logo, setLogo] = useState<File | null>(null);
  const [selectedAspectRatios, setSelectedAspectRatios] = useState<AspectRatio[]>([]);
  const [selectedModel, setSelectedModel] = useState<ImageModel>(AVAILABLE_MODELS[0]); // Default to Local Canvas

  const handleToggleAspectRatio = (ratio: AspectRatio) => {
    setSelectedAspectRatios(prev => {
      const exists = prev.some(r => r.id === ratio.id);
      if (exists) {
        return prev.filter(r => r.id !== ratio.id);
      } else {
        return [...prev, ratio];
      }
    });
  };

  const resetForm = () => {
    setPostType(null);
    setSelectedFestival(null);
    setCustomText('');
    setLogo(null);
    setSelectedAspectRatios([]);
    setSelectedModel(AVAILABLE_MODELS[0]); // Reset to default model
  };

  return (
    <div className="min-h-screen bg-gray-100">
      <Header />
      
      <main className="container mx-auto px-4 py-8 max-w-6xl">
        {/* Post Type Selection */}
        <PostTypeSelector 
          selectedType={postType} 
          onSelectType={setPostType}
        />
        
        {/* Festival Selection (only for event posts) */}
        {postType === 'event' && (
          <FestivalSelector 
            selectedFestival={selectedFestival}
            onSelectFestival={setSelectedFestival}
          />
        )}
        
        {/* Custom Text Input (for advertisements and announcements) */}
        {(postType === 'advertisement' || postType === 'announcement') && (
          <CustomTextInput 
            value={customText}
            onChange={setCustomText}
            postType={postType}
          />
        )}
        
        {/* Logo Upload */}
        {postType && (
          <LogoUploader 
            logo={logo}
            onLogoChange={setLogo}
          />
        )}
        
        {/* Model Selection */}
        {postType && (
          <ModelSelector 
            selectedModel={selectedModel}
            onModelChange={setSelectedModel}
          />
        )}
        
        {/* Aspect Ratio Selection */}
        {postType && (
          <AspectRatioSelector 
            selectedRatios={selectedAspectRatios}
            onToggleRatio={handleToggleAspectRatio}
          />
        )}
        
        {/* Image Generation */}
        {postType && (
          <ErrorBoundary>
            <ImageGenerator 
              postType={postType}
              festival={selectedFestival || undefined}
              customText={customText}
              logo={logo}
              aspectRatios={selectedAspectRatios}
              selectedModel={selectedModel}
            />
          </ErrorBoundary>
        )}
        
        {/* Reset Button */}
        {postType && (
          <div className="text-center mt-8">
            <button
              onClick={resetForm}
              className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Start Over
            </button>
          </div>
        )}
      </main>
      
      {/* Footer */}
      <footer className="bg-white border-t border-gray-200 py-6 mt-12">
        <div className="container mx-auto px-4 text-center text-gray-600">
          <p>&copy; 2024 ICAS Manipal Marketing Tool. Built with ❤️ for creative social media content.</p>
        </div>
      </footer>
    </div>
  );
}

export default App
