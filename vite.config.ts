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
    define: {
      'process.env.ONEDRIVE_CLIENT_ID': JSON.stringify(env.ONEDRIVE_CLIENT_ID || ''),
      'process.env.GOOGLE_DRIVE_CLIENT_ID': JSON.stringify(env.GOOGLE_DRIVE_CLIENT_ID || ''),
      'process.env.GOOGLE_DRIVE_API_KEY': JSON.stringify(env.GOOGLE_DRIVE_API_KEY || ''),
    },
    build: {
      outDir: 'dist',
      sourcemap: mode === 'development',
      rollupOptions: {
        output: {
          manualChunks: {
            vendor: ['react', 'react-dom', 'react-router-dom'],
            mui: ['@mui/material', '@mui/icons-material', '@mui/x-data-grid'],
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
