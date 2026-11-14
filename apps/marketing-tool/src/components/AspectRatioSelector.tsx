import { Check } from 'lucide-react';
import type { AspectRatio } from '../types';
import { aspectRatios } from '../data/festivals';
import Section from './Section';

interface AspectRatioSelectorProps {
  step: number;
  selectedRatios: AspectRatio[];
  onToggleRatio: (ratio: AspectRatio) => void;
  onSelectAll: (ratios: AspectRatio[]) => void;
}

/** A small rectangle drawn at the format's real proportions. */
const RatioPreview = ({ ratio }: { ratio: AspectRatio }) => {
  const scale = 40 / Math.max(ratio.width, ratio.height);
  return (
    <span className="grid place-items-center size-12 shrink-0" aria-hidden="true">
      <span
        className="block rounded-[3px] border-2 border-current"
        style={{ width: ratio.width * scale, height: ratio.height * scale }}
      />
    </span>
  );
};

const AspectRatioSelector = ({
  step,
  selectedRatios,
  onToggleRatio,
  onSelectAll,
}: AspectRatioSelectorProps) => {
  const isSelected = (ratio: AspectRatio) =>
    selectedRatios.some((selected) => selected.id === ratio.id);
  const allSelected = selectedRatios.length === aspectRatios.length;

  return (
    <Section
      id="formats"
      step={step}
      title="Select formats"
      description="One post is created per format, at the platform's native size."
    >
      <div className="flex justify-end -mt-3 mb-3">
        <button
          type="button"
          className="btn-ghost min-h-9 text-sm text-brand-fg"
          onClick={() => onSelectAll(allSelected ? [] : aspectRatios)}
        >
          {allSelected ? 'Clear all' : 'Select all'}
        </button>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3">
        {aspectRatios.map((ratio) => {
          const selected = isSelected(ratio);
          return (
            <button
              type="button"
              key={ratio.id}
              aria-pressed={selected}
              onClick={() => onToggleRatio(ratio)}
              className={`option flex items-center gap-3 ${selected ? 'text-brand-fg' : 'text-fg-subtle'}`}
            >
              {selected && (
                <span className="check-dot" aria-hidden="true">
                  <Check className="size-3.5" strokeWidth={3} />
                </span>
              )}
              <RatioPreview ratio={ratio} />
              <span className="min-w-0 pr-6">
                <span className="block font-semibold text-fg">{ratio.name}</span>
                <span className="block text-sm text-fg-muted">{ratio.description}</span>
                <span className="block text-xs text-fg-subtle tabular-nums mt-0.5">
                  {ratio.width} × {ratio.height} px
                </span>
              </span>
            </button>
          );
        })}
      </div>
    </Section>
  );
};

export default AspectRatioSelector;
