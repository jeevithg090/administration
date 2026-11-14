import { CircleAlert, CircleCheck, Loader2, Wand2 } from 'lucide-react';
import type { AspectRatio, ImageModel, PostRequest } from '../types';

interface GeneratePanelProps {
  request: PostRequest | null;
  logo: File | null;
  aspectRatios: AspectRatio[];
  model: ImageModel;
  missing: string[];
  isGenerating: boolean;
  progress: string;
  error: string | null;
  onGenerate: () => void;
}

const POST_TYPE_LABEL = {
  event: 'Festival greeting',
  advertisement: 'Advertisement',
  announcement: 'Announcement',
} as const;

const GeneratePanel = ({
  request,
  logo,
  aspectRatios,
  model,
  missing,
  isGenerating,
  progress,
  error,
  onGenerate,
}: GeneratePanelProps) => {
  const ready = missing.length === 0;
  const rows: [string, string][] = [
    ['Type', request ? POST_TYPE_LABEL[request.postType] : '–'],
    ...(request?.postType === 'event'
      ? ([['Festival', request.festival?.name ?? '–']] as [string, string][])
      : []),
    ['Message', request?.customText?.trim() || '–'],
    ['Logo', logo ? logo.name : 'None'],
    ['Renderer', model.name],
    [
      'Formats',
      aspectRatios.length ? aspectRatios.map((r) => r.name.replace(/ \(.*\)/, '')).join(', ') : '–',
    ],
  ];

  return (
    <section className="card" aria-labelledby="summary-heading">
      <h2 id="summary-heading" className="text-lg font-semibold tracking-tight">
        Your post
      </h2>

      <dl className="mt-4 grid grid-cols-[auto_minmax(0,1fr)] gap-x-4 gap-y-2 text-sm">
        {rows.map(([label, value]) => (
          <div key={label} className="contents">
            <dt className="text-fg-subtle">{label}</dt>
            <dd className="font-medium text-fg break-words line-clamp-3">{value}</dd>
          </div>
        ))}
      </dl>

      {!ready && !isGenerating && (
        <div className="mt-5">
          <p className="text-sm font-semibold mb-2" id="missing-heading">
            To do before generating
          </p>
          <ul className="space-y-1.5 text-sm" aria-labelledby="missing-heading">
            {missing.map((item) => (
              <li key={item} className="flex items-start gap-2 text-fg-muted">
                <CircleAlert className="size-4 mt-0.5 shrink-0 text-warn-fg" aria-hidden="true" />
                {item}
              </li>
            ))}
          </ul>
        </div>
      )}

      {ready && !isGenerating && (
        <p className="mt-5 flex items-center gap-2 text-sm font-medium text-success-fg">
          <CircleCheck className="size-4 shrink-0" aria-hidden="true" />
          Ready to generate {aspectRatios.length} post{aspectRatios.length === 1 ? '' : 's'}
        </p>
      )}

      <button
        type="button"
        onClick={onGenerate}
        disabled={!ready || isGenerating}
        aria-busy={isGenerating}
        className="btn-gradient w-full mt-5 min-h-12 text-base"
      >
        {isGenerating ? (
          <Loader2 className="size-5 animate-spin" aria-hidden="true" />
        ) : (
          <Wand2 className="size-5" aria-hidden="true" />
        )}
        {isGenerating ? 'Generating…' : 'Generate posts'}
      </button>

      <p
        className="mt-3 text-sm text-center text-brand-fg min-h-5"
        role="status"
        aria-live="polite"
      >
        {progress}
      </p>

      {error && (
        <div className="notice-error mt-2" role="alert">
          <CircleAlert className="size-5 shrink-0" aria-hidden="true" />
          <div>
            <p className="font-semibold">Couldn&apos;t generate posts</p>
            <p>{error}</p>
          </div>
        </div>
      )}
    </section>
  );
};

export default GeneratePanel;
