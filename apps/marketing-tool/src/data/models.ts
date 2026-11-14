import type { ImageModel } from '../types';

export const LOCAL_MODEL: ImageModel = {
  id: 'canvas-local',
  name: 'Local Canvas',
  description: 'Instant, offline rendering with festival colour themes. No API key required.',
  provider: 'local',
  features: ['Instant', 'Works offline', 'Festival themes', 'Your text and logo'],
};

export const AVAILABLE_MODELS: ImageModel[] = [
  LOCAL_MODEL,
  {
    id: 'openrouter-gemini-image',
    name: 'Gemini 2.5 Flash Image (OpenRouter)',
    description: 'AI-generated artwork from a detailed marketing prompt, via OpenRouter.',
    provider: 'openrouter',
    model: 'google/gemini-2.5-flash-image-preview',
    features: ['AI artwork', 'Detailed prompts', 'Logo overlay', 'Needs OpenRouter key'],
  },
  {
    id: 'hf-sdxl',
    name: 'Stable Diffusion XL (Hugging Face)',
    description: 'Open-source text-to-image model via the Hugging Face Inference API.',
    provider: 'huggingface',
    model: 'stabilityai/stable-diffusion-xl-base-1.0',
    features: ['Open source', 'Artistic style', 'Logo overlay', 'Needs Hugging Face token'],
  },
];
