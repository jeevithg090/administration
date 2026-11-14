import { Check, Cpu, Palette, Zap } from 'lucide-react';
import { AVAILABLE_MODELS } from '../data/models';
import type { ImageModel, ModelProvider } from '../types';
import Section from './Section';

interface ModelSelectorProps {
  step: number;
  selectedModel: ImageModel;
  onModelChange: (model: ImageModel) => void;
}

const PROVIDER: Record<ModelProvider, { icon: typeof Cpu; label: string; chip: string }> = {
  local: {
    icon: Cpu,
    label: 'Free · no key',
    chip: 'bg-success-soft text-success-fg',
  },
  openrouter: {
    icon: Zap,
    label: 'OpenRouter',
    chip: 'bg-brand-soft text-brand-fg',
  },
  huggingface: {
    icon: Palette,
    label: 'Hugging Face',
    chip: 'bg-warn-soft text-warn-fg',
  },
};

const ModelSelector = ({ step, selectedModel, onModelChange }: ModelSelectorProps) => (
  <Section
    id="model"
    step={step}
    title="Choose how to render"
    description="AI models need API keys on the server. If one fails, that post is rendered locally instead and you'll be told why."
  >
    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
      {AVAILABLE_MODELS.map((model) => {
        const provider = PROVIDER[model.provider];
        const Icon = provider.icon;
        const selected = selectedModel.id === model.id;
        return (
          <button
            type="button"
            key={model.id}
            aria-pressed={selected}
            onClick={() => onModelChange(model)}
            className="option flex flex-col gap-3"
          >
            {selected && (
              <span className="check-dot" aria-hidden="true">
                <Check className="size-3.5" strokeWidth={3} />
              </span>
            )}
            <span className="flex items-center gap-3 pr-7">
              <span className="option-icon" aria-hidden="true">
                <Icon className="size-5" />
              </span>
              <span className="font-semibold text-fg leading-snug">{model.name}</span>
            </span>
            <span className="text-sm text-fg-muted">{model.description}</span>
            <span className="mt-auto flex flex-wrap gap-1.5">
              <span className={`chip ${provider.chip}`}>{provider.label}</span>
              {model.features.slice(0, 2).map((feature) => (
                <span key={feature} className="chip bg-surface-muted text-fg-muted">
                  {feature}
                </span>
              ))}
            </span>
          </button>
        );
      })}
    </div>
  </Section>
);

export default ModelSelector;
