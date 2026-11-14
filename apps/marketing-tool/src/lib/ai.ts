import { config } from '../config';
import type { AspectRatio, ImageModel, PostRequestContext } from '../types';
import { buildFallbackPrompt, buildPromptMessages } from './prompts';

export class AiRequestError extends Error {
  readonly status?: number;

  constructor(message: string, status?: number) {
    super(message);
    this.name = 'AiRequestError';
    this.status = status;
  }
}

/** Turn an HTTP failure into a short, user-facing explanation. */
export function describeHttpError(service: string, status: number): string {
  if (status === 401 || status === 403)
    return `${service} rejected the API key. Check the server's key configuration.`;
  if (status === 402) return `${service} account has insufficient credits.`;
  if (status === 404) return `${service} endpoint not found. Is the AI proxy configured?`;
  if (status === 429) return `${service} rate limit reached. Please wait and try again.`;
  if (status >= 500) return `${service} is currently unavailable (HTTP ${status}).`;
  return `${service} request failed (HTTP ${status}).`;
}

async function postJson(
  url: string,
  body: unknown,
  service: string,
  timeoutMs: number,
): Promise<Response> {
  let response: Response;
  try {
    response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(timeoutMs),
    });
  } catch (error) {
    const timedOut = error instanceof DOMException && error.name === 'TimeoutError';
    throw new AiRequestError(timedOut ? `${service} timed out.` : `Could not reach ${service}.`);
  }
  if (!response.ok) {
    throw new AiRequestError(describeHttpError(service, response.status), response.status);
  }
  return response;
}

interface ChatMessage {
  content?: string | null;
  images?: { image_url?: { url?: string } }[];
}

export interface ChatCompletion {
  choices?: { message?: ChatMessage }[];
}

/** Ask a text model for a detailed image prompt; falls back to a template on any failure. */
export async function generateImagePrompt(
  request: PostRequestContext,
): Promise<{ prompt: string; source: 'ai' | 'template' }> {
  const { system, user } = buildPromptMessages(request);
  try {
    const response = await postJson(
      `${config.aiProxyBase}/openrouter/chat/completions`,
      {
        model: config.promptModel,
        messages: [
          { role: 'system', content: system },
          { role: 'user', content: user },
        ],
        max_tokens: 800,
        temperature: 0.8,
      },
      'OpenRouter',
      30_000,
    );
    const data = (await response.json()) as ChatCompletion;
    const prompt = data.choices?.[0]?.message?.content?.trim();
    if (!prompt) throw new AiRequestError('OpenRouter returned an empty prompt.');
    return { prompt, source: 'ai' };
  } catch (error) {
    console.warn('Prompt generation failed, using template prompt:', error);
    return { prompt: buildFallbackPrompt(request), source: 'template' };
  }
}

/** Extract an image URL from an OpenRouter chat completion with image output. */
export function extractOpenRouterImage(data: ChatCompletion): string | null {
  const message = data.choices?.[0]?.message;
  const fromImages = message?.images?.find((image) => image.image_url?.url)?.image_url?.url;
  if (fromImages) return fromImages;
  const content = message?.content ?? '';
  const match =
    /(data:image\/[a-z+]+;base64,[A-Za-z0-9+/=]+|https?:\/\/\S+\.(?:png|jpe?g|webp))/i.exec(
      content,
    );
  return match ? match[1] : null;
}

async function generateWithOpenRouter(
  model: string,
  prompt: string,
  aspectRatio: AspectRatio,
): Promise<string> {
  const response = await postJson(
    `${config.aiProxyBase}/openrouter/chat/completions`,
    {
      model,
      modalities: ['image', 'text'],
      messages: [
        {
          role: 'user',
          content: `${prompt}\n\nOutput a single ${aspectRatio.id} (${aspectRatio.width}x${aspectRatio.height}) social media image.`,
        },
      ],
    },
    'OpenRouter',
    120_000,
  );
  const url = extractOpenRouterImage((await response.json()) as ChatCompletion);
  if (!url) throw new AiRequestError('OpenRouter did not return an image.');
  return url;
}

/** Hugging Face text-to-image models take sizes in multiples of 8, up to 1024. */
export function huggingFaceSize(aspectRatio: AspectRatio): { width: number; height: number } {
  const scale = Math.min(1, 1024 / Math.max(aspectRatio.width, aspectRatio.height));
  const snap = (n: number) => Math.max(256, Math.round((n * scale) / 8) * 8);
  return { width: snap(aspectRatio.width), height: snap(aspectRatio.height) };
}

async function generateWithHuggingFace(
  model: string,
  prompt: string,
  aspectRatio: AspectRatio,
): Promise<string> {
  const response = await postJson(
    `${config.aiProxyBase}/huggingface/models/${model}`,
    { inputs: prompt, parameters: { ...huggingFaceSize(aspectRatio), guidance_scale: 7.5 } },
    'Hugging Face',
    120_000,
  );
  const blob = await response.blob();
  if (!blob.type.startsWith('image/')) {
    throw new AiRequestError('Hugging Face did not return an image.');
  }
  return URL.createObjectURL(blob);
}

/** Generate a raw image with a remote model. Throws on failure. */
export async function generateAiImage(
  model: ImageModel,
  prompt: string,
  aspectRatio: AspectRatio,
): Promise<string> {
  if (!model.model) throw new AiRequestError(`${model.name} has no model identifier configured.`);
  switch (model.provider) {
    case 'openrouter':
      return generateWithOpenRouter(model.model, prompt, aspectRatio);
    case 'huggingface':
      return generateWithHuggingFace(model.model, prompt, aspectRatio);
    default:
      throw new AiRequestError(`${model.name} is not a remote model.`);
  }
}
