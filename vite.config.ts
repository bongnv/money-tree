import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import { copyFileSync } from 'fs';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');

  return {
    plugins: [
      react(),
      {
        name: 'copy-files',
        closeBundle() {
          // Copy _headers and _redirects to dist folder
          try {
            copyFileSync('public/_headers', 'dist/_headers');
            copyFileSync('public/_redirects', 'dist/_redirects');
          } catch (err) {
            console.warn('Could not copy _headers or _redirects files');
          }
        },
      },
    ],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, './src'),
        '@components': path.resolve(__dirname, './src/components'),
        '@stores': path.resolve(__dirname, './src/stores'),
        '@services': path.resolve(__dirname, './src/services'),
        '@types': path.resolve(__dirname, './src/types'),
        '@utils': path.resolve(__dirname, './src/utils'),
        '@hooks': path.resolve(__dirname, './src/hooks'),
        '@constants': path.resolve(__dirname, './src/constants'),
        '@schemas': path.resolve(__dirname, './src/schemas'),
      },
    },
    build: {
      outDir: 'dist',
      sourcemap: mode === 'development',
      chunkSizeWarningLimit: 1000,
      rollupOptions: {
        output: {
          manualChunks: (id) => {
            if (id.includes('node_modules')) {
              // Independent utilities - no React dependencies
              if (
                id.includes('/date-fns') ||
                id.includes('/zod') ||
                id.includes('/fflate')
              ) {
                return 'utils';
              }

              // Charts library - React component but isolated
              if (id.includes('/recharts/')) {
                return 'recharts';
              }

              // MUI components - large library
              if (id.includes('/@mui/')) {
                return 'mui';
              }

              // Azure/Microsoft authentication libraries
              if (id.includes('/@azure/') || id.includes('/@microsoft/')) {
                return 'microsoft';
              }
            }
          },
        },
      },
    },
    server: {
      port: 3000,
      open: true,
    },
  };
});
