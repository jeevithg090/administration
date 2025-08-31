export interface Festival {
  id: string;
  name: string;
  description: string;
  date: string;
  category: 'religious' | 'cultural' | 'national' | 'seasonal';
  colors: string[];
  keywords: string[];
}

export interface PostType {
  id: string;
  name: string;
  description: string;
}

export interface AspectRatio {
  id: string;
  name: string;
  description: string;
  width: number;
  height: number;
}

export interface ImageModel {
  id: string;
  name: string;
  description: string;
  provider: 'local' | 'openrouter' | 'huggingface' | 'qwen';
  endpoint?: string;
  features: string[];
}

export interface GeneratedImage {
  url: string;
  aspectRatio: AspectRatio;
  prompt: string;
  model: string;
}

export interface PostRequest {
  type: 'event' | 'advertisement' | 'announcement';
  festival?: Festival;
  customText?: string;
  logo?: File;
  aspectRatios: AspectRatio[];
  imageModel?: ImageModel;
}