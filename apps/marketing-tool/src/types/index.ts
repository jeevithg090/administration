export type PostTypeId = 'event' | 'advertisement' | 'announcement';

export type FestivalCategory = 'religious' | 'cultural' | 'national' | 'seasonal';

export interface Festival {
  id: string;
  name: string;
  description: string;
  date: string;
  category: FestivalCategory;
  colors: string[];
  keywords: string[];
}

export interface PostType {
  id: PostTypeId;
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

export type ModelProvider = 'local' | 'openrouter' | 'huggingface';

export interface ImageModel {
  id: string;
  name: string;
  description: string;
  provider: ModelProvider;
  /** Provider-specific model identifier (OpenRouter slug or Hugging Face repo id). */
  model?: string;
  features: string[];
}

/** Everything needed to describe one post, independent of output size. */
export interface PostRequest {
  postType: PostTypeId;
  brandName: string;
  festival?: Festival;
  customText?: string;
}

/** A post request for one specific output size. */
export interface PostRequestContext extends PostRequest {
  aspectRatio: AspectRatio;
}

export interface GeneratedImage {
  aspectRatio: AspectRatio;
  imageUrl: string;
  prompt: string;
  /** Name of the model that actually produced the image. */
  model: string;
  /** Set when the selected model failed and the local renderer was used instead. */
  fallbackReason?: string;
}
