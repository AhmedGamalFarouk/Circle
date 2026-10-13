import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react-swc'
import tailwindcss from '@tailwindcss/vite'
import path from 'path'
import { Buffer } from 'node:buffer'

// Serves api/*.js (the Vercel routes) from the dev server in development and e2e
// mode, so the app and Playwright reach them on the same origin as in production.
function apiRoutes() {
  return {
    name: 'circle-api-routes',
    configureServer(server) {
      server.middlewares.use(async (req, res, next) => {
        const match = req.url.match(/^\/api\/([a-z-]+)(?:\?|$)/);
        if (!match) return next();
        try {
          const route = await server.ssrLoadModule(`/api/${match[1]}.js`);
          const handler = route[req.method];
          if (!handler) {
            res.statusCode = 405;
            return res.end();
          }
          const chunks = [];
          for await (const chunk of req) chunks.push(chunk);
          const body = ['GET', 'HEAD'].includes(req.method) ? undefined : Buffer.concat(chunks);
          const response = await handler(new Request(`http://${req.headers.host}${req.url}`, {
            method: req.method, headers: req.headers, body,
          }));
          res.statusCode = response.status;
          response.headers.forEach((value, key) => res.setHeader(key, value));
          res.end(Buffer.from(await response.arrayBuffer()));
        } catch (error) {
          server.config.logger.error(`api/${match[1]}: ${error.stack || error}`);
          res.statusCode = 500;
          res.end(JSON.stringify({ ok: false, error: 'server' }));
        }
      });
    },
  };
}

// https://vite.dev/config/
export default defineConfig(({ mode }) => ({
  plugins: [react(), tailwindcss(), ...(mode === 'development' || mode === 'e2e' ? [apiRoutes()] : [])],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'), // 👈 alias for /src
    },
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          // Vendor chunks
          'react-vendor': ['react', 'react-dom', 'react-router', 'react-router-dom'],
          'redux-vendor': ['react-redux', '@reduxjs/toolkit', 'redux-persist'],
          'firebase-vendor': ['firebase/app', 'firebase/auth', 'firebase/firestore'],
          'ui-vendor': ['@mui/material', '@mui/icons-material', 'lucide-react', 'clsx'],
          'i18n-vendor': ['react-i18next', 'i18next'],
          'form-vendor': ['react-hook-form', 'react-select'],
          'toast-vendor': ['react-toastify'],
          'animation-vendor': ['framer-motion'],
          'map-vendor': ['leaflet', 'react-leaflet'],
          'utils-vendor': ['axios', 'uuid', 'universal-cookie'],

          // Feature chunks
          'auth-pages': [
            './src/pages/Authentication/LoginPage/LoginPage',
            './src/pages/Authentication/RegisterPage/RegisterPage',
            './src/pages/Authentication/ForgetPasswordPage/ForgetPasswordContainer'
          ],
          'circle-pages': [
            './src/pages/CirclesPage/CirclesPageContainer.jsx',
            './src/pages/CirlclePage/CirclePageContainer.jsx'
          ],
          'memory-pages': [
            './src/pages/Memories',
            './src/pages/Memories/AddMemories.jsx'
          ],
          'payment-pages': [
            './src/pages/Payments/PaymentContainer'
          ],
          'chat-components': [
            './src/components/Chat/ChatWindow/ChatWindowContainer.jsx',
            './src/components/Chat/ChatMessage/ChatMessageContainer.jsx',
            './src/components/Chat/ChatInput/ChatInputContainer.jsx',
            './src/components/Chat/ChatSidebar/ChatSidebarContainer.jsx'
          ]
        }
      }
    },
    chunkSizeWarningLimit: 1000
  }
}))
