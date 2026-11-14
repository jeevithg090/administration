import { defineConfig, loadEnv, type ProxyOptions } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

/**
 * Proxy `/api/<service>/*` to the AI provider, adding the API key on the
 * server side. Keys are read from non-`VITE_` variables, so they are never
 * bundled into client code. In production, configure the same rewrites in
 * your reverse proxy (see README).
 */
function aiProxy(env: Record<string, string>): Record<string, ProxyOptions> {
  const routes: Record<string, ProxyOptions> = {};

  // Routes are only registered when a key is configured, so unconfigured
  // providers answer 404 locally instead of sending unauthenticated requests.
  const add = (prefix: string, target: string, key: string | undefined) => {
    if (!key) return;
    routes[prefix] = {
      target,
      changeOrigin: true,
      rewrite: (path) => path.slice(prefix.length),
      configure: (proxy) => {
        proxy.on('proxyReq', (proxyReq) => {
          proxyReq.removeHeader('cookie');
          proxyReq.setHeader('Authorization', `Bearer ${key}`);
        });
      },
    };
  };

  add('/api/openrouter', 'https://openrouter.ai/api/v1', env.OPENROUTER_API_KEY);
  add(
    '/api/huggingface',
    env.HUGGINGFACE_BASE_URL || 'https://router.huggingface.co/hf-inference',
    env.HUGGINGFACE_API_KEY,
  );
  return routes;
}

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  const proxy = aiProxy(env);

  return {
    plugins: [react(), tailwindcss()],
    server: { proxy },
    preview: { proxy },
  };
});
