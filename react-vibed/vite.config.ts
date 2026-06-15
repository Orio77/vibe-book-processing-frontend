import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';
import path from 'node:path';

// https://vite.dev/config/
export default defineConfig({
    plugins: [
        react(),
        VitePWA({
            registerType: 'autoUpdate',
            includeAssets: ['vite.svg', 'pwa-icon.svg', 'pwa-maskable.svg'],
            manifest: {
                name: 'Book Processing',
                short_name: 'Books',
                description: 'Read and study PDF books online or offline.',
                theme_color: '#ffffff',
                background_color: '#f8fafc',
                display: 'standalone',
                orientation: 'any',
                scope: '/',
                start_url: '/',
                icons: [
                    {
                        src: '/pwa-icon.svg',
                        sizes: '512x512',
                        type: 'image/svg+xml',
                        purpose: 'any',
                    },
                    {
                        src: '/pwa-maskable.svg',
                        sizes: '512x512',
                        type: 'image/svg+xml',
                        purpose: 'maskable',
                    },
                ],
                categories: ['books', 'education', 'productivity'],
            },
            workbox: {
                globPatterns: ['**/*.{js,css,html,ico,png,svg,woff2}'],
                navigateFallback: 'index.html',
                navigateFallbackDenylist: [/^\/api\//],
            },
            devOptions: {
                enabled: false,
            },
        }),
    ],
    define: {
        global: 'globalThis',
    },
    optimizeDeps: {
        esbuildOptions: {
            define: {
                global: 'globalThis',
            },
        },
    },
    resolve: {
        alias: {
            '@': path.resolve(__dirname, './src'),
        },
    },
    server: {
        port: 5174,
        open: true,
    },
});
