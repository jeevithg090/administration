import type { Ref } from 'react';
import { AlertTriangle, Download, Images } from 'lucide-react';
import type { AspectRatio, GeneratedImage, PostTypeId } from '../types';

interface GeneratedPostsProps {
  images: GeneratedImage[];
  pending: AspectRatio[];
  postType: PostTypeId;
  modelName: string;
  headingRef?: Ref<HTMLHeadingElement>;
}

function fileName(image: GeneratedImage, index: number): string {
  const ext = image.imageUrl.startsWith('data:image/svg') ? 'svg' : 'png';
  return `post-${image.aspectRatio.id.replace(':', 'x')}-${index + 1}.${ext}`;
}

function downloadAll(images: GeneratedImage[]) {
  images.forEach((image, index) => {
    // Stagger the clicks; some browsers drop simultaneous downloads.
    setTimeout(() => {
      const link = document.createElement('a');
      link.href = image.imageUrl;
      link.download = fileName(image, index);
      link.click();
    }, index * 250);
  });
}

const ratioStyle = (ratio: AspectRatio) => ({ aspectRatio: `${ratio.width} / ${ratio.height}` });

/** Results grid, with skeleton placeholders while posts are being generated. */
const GeneratedPosts = ({
  images,
  pending,
  postType,
  modelName,
  headingRef,
}: GeneratedPostsProps) => {
  const generating = pending.length > 0;
  if (!generating && images.length === 0) return null;

  const fallbacks = images.filter((image) => image.fallbackReason);

  return (
    <section className="card" aria-labelledby="results-heading" aria-busy={generating}>
      <div className="flex flex-wrap items-center justify-between gap-3 mb-5">
        <h2
          id="results-heading"
          ref={headingRef}
          tabIndex={-1}
          className="section-heading focus:outline-none focus-visible:outline-2"
        >
          <Images className="size-6 text-brand" aria-hidden="true" />
          {generating
            ? `Creating ${pending.length} post${pending.length === 1 ? '' : 's'}…`
            : `${images.length} post${images.length === 1 ? '' : 's'} ready`}
        </h2>
        {images.length > 1 && (
          <button type="button" onClick={() => downloadAll(images)} className="btn-secondary">
            <Download className="size-4" aria-hidden="true" />
            Download all
          </button>
        )}
      </div>

      {fallbacks.length > 0 && (
        <div className="notice-warn mb-5" role="status">
          <AlertTriangle className="size-5 shrink-0" aria-hidden="true" />
          <div>
            <p className="font-semibold">
              {modelName} was unavailable for {fallbacks.length} of {images.length} post
              {images.length === 1 ? '' : 's'}, so {fallbacks.length === 1 ? 'it was' : 'they were'}{' '}
              rendered locally instead.
            </p>
            <p className="mt-1">{fallbacks[0].fallbackReason}</p>
          </div>
        </div>
      )}

      <ul className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 items-start">
        {generating
          ? pending.map((ratio) => (
              <li key={ratio.id} className="rounded-xl border border-line p-3" aria-hidden="true">
                <div className="skeleton w-full" style={ratioStyle(ratio)} />
                <div className="skeleton h-4 w-2/3 mt-3" />
                <div className="skeleton h-3 w-1/2 mt-2" />
              </li>
            ))
          : images.map((image, index) => (
              <li
                key={`${image.aspectRatio.id}-${index}`}
                className="rounded-xl border border-line bg-surface-muted p-3 flex flex-col animate-fade-in"
              >
                <div className="rounded-lg overflow-hidden bg-surface shadow-sm">
                  <img
                    src={image.imageUrl}
                    alt={`Generated ${postType} post, ${image.aspectRatio.name}`}
                    className="w-full h-auto object-contain"
                    style={ratioStyle(image.aspectRatio)}
                  />
                </div>
                <div className="flex items-end justify-between gap-3 mt-3">
                  <div className="min-w-0">
                    <h3 className="font-semibold text-fg">{image.aspectRatio.name}</h3>
                    <p className="text-xs text-fg-subtle tabular-nums">
                      {image.aspectRatio.width} × {image.aspectRatio.height} · {image.model}
                    </p>
                  </div>
                  <a
                    href={image.imageUrl}
                    download={fileName(image, index)}
                    className="btn-primary px-4 shrink-0"
                    aria-label={`Download ${image.aspectRatio.name}`}
                  >
                    <Download className="size-4" aria-hidden="true" />
                    <span>Save</span>
                  </a>
                </div>
              </li>
            ))}
      </ul>
    </section>
  );
};

export default GeneratedPosts;
