import { LOCAL_MODEL } from '../data/models';
import type { AspectRatio, GeneratedImage, ImageModel, PostRequest } from '../types';
import { generateAiImage, generateImagePrompt } from './ai';
import { finalizeImage, renderLocalPost } from './canvas';
import { buildFallbackPrompt } from './prompts';
import { buildPostContent } from './postContent';

export interface GenerateOptions {
  request: PostRequest;
  aspectRatios: AspectRatio[];
  model: ImageModel;
  logoUrl?: string;
  onProgress?: (message: string) => void;
}

/**
 * Generate one post per aspect ratio. Remote model failures fall back to the
 * local renderer for that size, and the result records why.
 */
export async function generatePosts(options: GenerateOptions): Promise<GeneratedImage[]> {
  const { request, aspectRatios, model, logoUrl, onProgress } = options;
  if (aspectRatios.length === 0) return [];

  const content = buildPostContent(request);
  const isRemote = model.provider !== 'local';

  let prompt = buildFallbackPrompt({ ...request, aspectRatio: aspectRatios[0] });
  if (isRemote) {
    onProgress?.('Writing a detailed image prompt…');
    prompt = (await generateImagePrompt({ ...request, aspectRatio: aspectRatios[0] })).prompt;
  }

  const results: GeneratedImage[] = [];
  for (const [index, aspectRatio] of aspectRatios.entries()) {
    onProgress?.(`Creating ${aspectRatio.name} (${index + 1}/${aspectRatios.length})…`);

    if (isRemote) {
      try {
        const raw = await generateAiImage(model, prompt, aspectRatio);
        results.push({
          aspectRatio,
          prompt,
          model: model.name,
          imageUrl: await finalizeImage(raw, aspectRatio, logoUrl),
        });
        continue;
      } catch (error) {
        results.push({
          aspectRatio,
          prompt,
          model: LOCAL_MODEL.name,
          fallbackReason: error instanceof Error ? error.message : String(error),
          imageUrl: await renderLocalPost(content, aspectRatio, logoUrl),
        });
        continue;
      }
    }

    results.push({
      aspectRatio,
      prompt,
      model: LOCAL_MODEL.name,
      imageUrl: await renderLocalPost(content, aspectRatio, logoUrl),
    });
  }
  return results;
}

/** Reasons the current form cannot be submitted yet (empty when ready). */
export function missingRequirements(request: PostRequest, aspectRatios: AspectRatio[]): string[] {
  const missing: string[] = [];
  if (request.postType === 'event' && !request.festival)
    missing.push('Choose a festival to celebrate');
  if (request.postType !== 'event' && !request.customText?.trim())
    missing.push('Enter your message text');
  if (aspectRatios.length === 0) missing.push('Select at least one format');
  return missing;
}
