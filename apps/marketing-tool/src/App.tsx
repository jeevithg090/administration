import { useState } from 'react';
import AspectRatioSelector from './components/AspectRatioSelector';
import CustomTextInput from './components/CustomTextInput';
import ErrorBoundary from './components/ErrorBoundary';
import FestivalSelector from './components/FestivalSelector';
import Header from './components/Header';
import ImageGenerator from './components/ImageGenerator';
import LogoUploader from './components/LogoUploader';
import ModelSelector from './components/ModelSelector';
import PostTypeSelector from './components/PostTypeSelector';
import { config } from './config';
import { LOCAL_MODEL } from './data/models';
import type { AspectRatio, Festival, ImageModel, PostTypeId } from './types';

function App() {
  const [postType, setPostType] = useState<PostTypeId | null>(null);
  const [selectedFestival, setSelectedFestival] = useState<Festival | null>(null);
  const [customText, setCustomText] = useState('');
  const [logo, setLogo] = useState<File | null>(null);
  const [selectedAspectRatios, setSelectedAspectRatios] = useState<AspectRatio[]>([]);
  const [selectedModel, setSelectedModel] = useState<ImageModel>(LOCAL_MODEL);

  const handleToggleAspectRatio = (ratio: AspectRatio) => {
    setSelectedAspectRatios((previous) =>
      previous.some((r) => r.id === ratio.id)
        ? previous.filter((r) => r.id !== ratio.id)
        : [...previous, ratio],
    );
  };

  const resetForm = () => {
    setPostType(null);
    setSelectedFestival(null);
    setCustomText('');
    setLogo(null);
    setSelectedAspectRatios([]);
    setSelectedModel(LOCAL_MODEL);
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Header />

      <main className="container mx-auto px-4 py-8 max-w-6xl flex-1">
        <PostTypeSelector selectedType={postType} onSelectType={setPostType} />

        {postType === 'event' && (
          <FestivalSelector
            selectedFestival={selectedFestival}
            onSelectFestival={setSelectedFestival}
          />
        )}

        {postType && (
          <>
            <CustomTextInput value={customText} onChange={setCustomText} postType={postType} />
            <LogoUploader logo={logo} onLogoChange={setLogo} />
            <ModelSelector selectedModel={selectedModel} onModelChange={setSelectedModel} />
            <AspectRatioSelector
              selectedRatios={selectedAspectRatios}
              onToggleRatio={handleToggleAspectRatio}
            />
            <ErrorBoundary>
              <ImageGenerator
                request={{
                  postType,
                  brandName: config.brandName,
                  festival: postType === 'event' ? (selectedFestival ?? undefined) : undefined,
                  customText,
                }}
                logo={logo}
                aspectRatios={selectedAspectRatios}
                selectedModel={selectedModel}
              />
            </ErrorBoundary>
            <div className="text-center mt-8">
              <button
                type="button"
                onClick={resetForm}
                className="px-6 py-2 border border-gray-300 text-gray-700 bg-white rounded-lg hover:bg-gray-50 transition-colors"
              >
                Start Over
              </button>
            </div>
          </>
        )}
      </main>

      <footer className="bg-white border-t border-gray-200 py-6 mt-12">
        <div className="container mx-auto px-4 text-center text-gray-600 text-sm">
          <p>
            &copy; {new Date().getFullYear()} {config.brandName} · Marketing Post Generator
          </p>
        </div>
      </footer>
    </div>
  );
}

export default App;
