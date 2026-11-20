import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// En développement, sert la fonction serverless api/chat.js comme le ferait Vercel.
// La clé est lue dans l'environnement : ANTHROPIC_API_KEY=... npm run dev
// Import dynamique par URL calculée : Vite ne le suit pas en regroupant ce fichier de config,
// donc le build et les tests n'ont pas besoin du SDK installé à la racine (cas de la CI).
const API_HANDLER_URL = new URL('../api/chat.js', import.meta.url).href;

const localApi = {
  name: 'local-api',
  apply: 'serve',
  configureServer(server) {
    server.middlewares.use('/api/chat', async (req, res) => {
      const { default: handler } = await import(/* @vite-ignore */ API_HANDLER_URL);
      await handler(req, res);
    });
  },
};

export default defineConfig({
  plugins: [react(), localApi],
  server: {
    port: 3000,
  },
});
