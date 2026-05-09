import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react-swc';
import path from 'path';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    react({
      // Use SWC for faster builds
      jsxRuntime: 'automatic',
    }),
  ],
  
  resolve: {
    alias: {
      // Aliases for cleaner imports
      '@': path.resolve(__dirname, './'),
      '@components': path.resolve(__dirname, './components'),
      '@utils': path.resolve(__dirname, './utils'),
      '@styles': path.resolve(__dirname, './styles'),
    },
  },
  
  // Build configuration for production
  build: {
    outDir: 'build',
    sourcemap: false,
    minify: 'terser',
    target: 'es2015',
    cssCodeSplit: true,
    
    // Optimize chunk splitting
    rollupOptions: {
      input: {
        main: path.resolve(__dirname, 'index.html')
      },
      output: {
        manualChunks: {
          // Core React
          'react-vendor': ['react', 'react-dom'],
          
          // Firebase
          'firebase-vendor': ['firebase/app', 'firebase/auth', 'firebase/firestore', 'firebase/storage'],
          
          // UI components
          'ui-vendor': [
            'lucide-react',
            'motion',
            'recharts',
            'react-hook-form',
          ],
          
          // Radix UI
          'radix-vendor': [
            '@radix-ui/react-dialog',
            '@radix-ui/react-dropdown-menu',
            '@radix-ui/react-select',
            '@radix-ui/react-tabs',
            '@radix-ui/react-popover',
          ],
        },
      },
    },
    
    // Chunk size warnings
    chunkSizeWarningLimit: 1000,
  },
  
  // Development server configuration
  server: {
    port: 3000,
    host: true,
    open: true,
    cors: true,
    strictPort: false,
  },
  
  // Preview server configuration
  preview: {
    port: 4173,
    host: true,
    strictPort: false,
  },
  
  // Optimize dependencies
  optimizeDeps: {
    include: [
      'react',
      'react-dom',
      'firebase/app',
      'firebase/auth',
      'firebase/firestore',
      'firebase/storage',
      'lucide-react',
      'motion',
    ],
    exclude: ['@builder.io/sdk'],
  },
  
  // Define environment variables
  define: {
    'process.env': {},
  },
  
  // CSS configuration
  css: {
    devSourcemap: true,
  },
});
