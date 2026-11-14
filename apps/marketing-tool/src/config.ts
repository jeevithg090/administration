/** Runtime configuration, read from `VITE_*` variables at build time. */
export const config = {
  /** Institution name rendered on posts and used in prompts. */
  brandName: import.meta.env.VITE_BRAND_NAME?.trim() || 'ICAS Manipal',
  /**
   * Base path of the server-side AI proxy. API keys are injected by the proxy
   * (Vite dev/preview server or your production reverse proxy), never by the browser.
   */
  aiProxyBase: (import.meta.env.VITE_AI_PROXY_BASE?.trim() || '/api').replace(/\/$/, ''),
  /** OpenRouter model used to write image prompts. */
  promptModel: import.meta.env.VITE_PROMPT_MODEL?.trim() || 'anthropic/claude-3.5-sonnet',
} as const;
