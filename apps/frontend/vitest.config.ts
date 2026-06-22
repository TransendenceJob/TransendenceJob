import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
    plugins: [react()],
    resolve: {
        alias: {
            // Directs the "@" prefix to the root of your frontend app
            '@': path.resolve(__dirname, './'),
        },
    },
    test: {
        globals: true,
        environment: 'jsdom',
        setupFiles: './vitest.setup.ts',
        // Ensures tests run smoothly in a monorepo
        include: ['**/*.test.{ts,tsx}'],
    },
});