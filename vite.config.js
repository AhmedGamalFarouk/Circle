import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react-swc'
import tailwindcss from '@tailwindcss/vite'
import path from 'path'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
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
})
