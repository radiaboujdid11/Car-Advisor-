import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// En développement, sert la fonction serverless api/chat.js comme le ferait Vercel.
// La clé est lue dans l'environnement : ANTHROPIC_API_KEY=... npm run dev
const localApi = {
  name: 'local-api',
  apply: 'serve',
  configureServer(server) {
    server.middlewares.use('/api/chat', async (req, res) => {
      const { default: handler } = await import('../api/chat.js');
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
