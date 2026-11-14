import { useEffect, useRef, useState } from 'react';
import { Loader2, RotateCcw, Wand2 } from 'lucide-react';
import AspectRatioSelector from './components/AspectRatioSelector';
import CustomTextInput from './components/CustomTextInput';
import ErrorBoundary from './components/ErrorBoundary';
import FestivalSelector from './components/FestivalSelector';
import GeneratedPosts from './components/GeneratedPosts';
import GeneratePanel from './components/GeneratePanel';
import Header from './components/Header';
import LogoUploader from './components/LogoUploader';
import ModelSelector from './components/ModelSelector';
import NotFound from './components/NotFound';
import PostTypeSelector from './components/PostTypeSelector';
import { config } from './config';
import { LOCAL_MODEL } from './data/models';
import { useObjectUrl } from './hooks/useObjectUrl';
import { usePostGeneration } from './hooks/usePostGeneration';
import { missingRequirements } from './lib/generate';
import type { AspectRatio, Festival, ImageModel, PostRequest, PostTypeId } from './types';

/** The app has a single page; any other path (served by an SPA fallback) is a 404. */
function isKnownPath(): boolean {
  const base = import.meta.env.BASE_URL;
  const { pathname } = window.location;
  const rest = pathname.startsWith(base) ? pathname.slice(base.length) : pathname;
  return rest === '' || rest === 'index.html';
}

const prefersReducedMotion = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches;

function App() {
  const [known] = useState(isKnownPath);
  const [postType, setPostType] = useState<PostTypeId | null>(null);
  const [selectedFestival, setSelectedFestival] = useState<Festival | null>(null);
  const [customText, setCustomText] = useState('');
  const [logo, setLogo] = useState<File | null>(null);
  const [selectedAspectRatios, setSelectedAspectRatios] = useState<AspectRatio[]>([]);
  const [selectedModel, setSelectedModel] = useState<ImageModel>(LOCAL_MODEL);
  const generation = usePostGeneration();
  const logoUrl = useObjectUrl(logo);
  const resultsHeadingRef = useRef<HTMLHeadingElement>(null);

  useEffect(() => {
    if (!known) document.title = 'Page not found · Marketing Post Generator';
  }, [known]);

  const request: PostRequest | null = postType
    ? {
        postType,
        brandName: config.brandName,
        festival: postType === 'event' ? (selectedFestival ?? undefined) : undefined,
        customText,
      }
    : null;

  const missing = request
    ? missingRequirements(request, selectedAspectRatios)
    : ['Choose a post type'];

  const handleToggleAspectRatio = (ratio: AspectRatio) => {
    setSelectedAspectRatios((previous) =>
      previous.some((r) => r.id === ratio.id)
        ? previous.filter((r) => r.id !== ratio.id)
        : [...previous, ratio],
    );
  };

  const scrollToResults = () => {
    const heading = resultsHeadingRef.current;
    if (!heading) return;
    heading.scrollIntoView({
      behavior: prefersReducedMotion() ? 'auto' : 'smooth',
      block: 'start',
    });
    heading.focus({ preventScroll: true });
  };

  const handleGenerate = async () => {
    if (!request || missing.length > 0 || generation.isGenerating) return;
    const run = generation.generate({
      request,
      aspectRatios: selectedAspectRatios,
      model: selectedModel,
      logoUrl: logoUrl ?? undefined,
    });
    // Wait a frame so the skeleton section exists, then bring it into view.
    requestAnimationFrame(scrollToResults);
    if (await run) requestAnimationFrame(scrollToResults);
  };

  const resetForm = () => {
    setPostType(null);
    setSelectedFestival(null);
    setCustomText('');
    setLogo(null);
    setSelectedAspectRatios([]);
    setSelectedModel(LOCAL_MODEL);
    generation.reset();
    window.scrollTo({ top: 0, behavior: prefersReducedMotion() ? 'auto' : 'smooth' });
  };

  // Section numbers shift when the festival step is not shown.
  const offset = postType === 'event' ? 1 : 0;

  return (
    <div className="min-h-screen flex flex-col">
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:fixed focus:top-3 focus:left-3 focus:z-50 focus:rounded-lg focus:bg-surface focus:px-4 focus:py-2 focus:font-semibold focus:text-brand-fg focus:shadow-lg"
      >
        Skip to content
      </a>
      <Header />

      <main
        id="main"
        tabIndex={-1}
        className="mx-auto w-full max-w-7xl px-4 sm:px-6 py-6 sm:py-8 flex-1 focus:outline-none"
      >
        {!known ? (
          <NotFound />
        ) : (
          <>
            <div className="mb-6 sm:mb-8">
              <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">
                Create social media posts
              </h1>
              <p className="mt-1 text-fg-muted max-w-2xl">
                Branded festival greetings, ads and announcements in every common format, with your
                logo on each one.
              </p>
            </div>

            <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_22rem] items-start">
              <div className="space-y-6 min-w-0">
                <PostTypeSelector selectedType={postType} onSelectType={setPostType} />

                {postType === 'event' && (
                  <FestivalSelector
                    selectedFestival={selectedFestival}
                    onSelectFestival={setSelectedFestival}
                  />
                )}

                {postType && (
                  <>
                    <CustomTextInput
                      step={2 + offset}
                      value={customText}
                      onChange={setCustomText}
                      postType={postType}
                    />
                    <LogoUploader step={3 + offset} logo={logo} onLogoChange={setLogo} />
                    <ModelSelector
                      step={4 + offset}
                      selectedModel={selectedModel}
                      onModelChange={setSelectedModel}
                    />
                    <AspectRatioSelector
                      step={5 + offset}
                      selectedRatios={selectedAspectRatios}
                      onToggleRatio={handleToggleAspectRatio}
                      onSelectAll={setSelectedAspectRatios}
                    />
                  </>
                )}
              </div>

              <aside className="lg:sticky lg:top-6 space-y-4" aria-label="Summary and generate">
                <GeneratePanel
                  request={request}
                  logo={logo}
                  aspectRatios={selectedAspectRatios}
                  model={selectedModel}
                  missing={missing}
                  isGenerating={generation.isGenerating}
                  progress={generation.progress}
                  error={generation.error}
                  onGenerate={handleGenerate}
                />
                {postType && (
                  <button type="button" onClick={resetForm} className="btn-ghost w-full">
                    <RotateCcw className="size-4" aria-hidden="true" />
                    Start over
                  </button>
                )}
              </aside>
            </div>

            {postType && (
              <div className="mt-6">
                <ErrorBoundary>
                  <GeneratedPosts
                    images={generation.images}
                    pending={generation.pending}
                    postType={postType}
                    modelName={selectedModel.name}
                    headingRef={resultsHeadingRef}
                  />
                </ErrorBoundary>
              </div>
            )}
          </>
        )}
      </main>

      {known && postType && (
        <div
          className="lg:hidden fixed inset-x-0 bottom-0 z-40 border-t border-line bg-surface/95 backdrop-blur px-4 py-3 flex items-center gap-3"
          style={{ paddingBottom: 'max(0.75rem, env(safe-area-inset-bottom))' }}
        >
          <p className="flex-1 min-w-0 text-sm text-fg-muted truncate" aria-hidden="true">
            {generation.isGenerating
              ? generation.progress || 'Generating…'
              : missing.length > 0
                ? missing[0]
                : `${selectedAspectRatios.length} format${selectedAspectRatios.length === 1 ? '' : 's'} selected`}
          </p>
          <button
            type="button"
            onClick={handleGenerate}
            disabled={missing.length > 0 || generation.isGenerating}
            className="btn-gradient shrink-0"
          >
            {generation.isGenerating ? (
              <Loader2 className="size-5 animate-spin" aria-hidden="true" />
            ) : (
              <Wand2 className="size-5" aria-hidden="true" />
            )}
            Generate
          </button>
        </div>
      )}

      <footer className={`border-t border-line bg-surface ${postType ? 'pb-20 lg:pb-0' : ''}`}>
        <div className="mx-auto max-w-7xl px-4 sm:px-6 py-6 flex flex-col sm:flex-row gap-2 justify-between text-sm text-fg-subtle">
          <p>
            &copy; {new Date().getFullYear()} {config.brandName} · Marketing Post Generator
          </p>
          <p>Local rendering happens entirely in your browser.</p>
        </div>
      </footer>
    </div>
  );
}

export default App;
