import tailwindcss from '@tailwindcss/vite';
import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vitest/config';
import wasm from 'vite-plugin-wasm';

export default defineConfig({
	build: {
		target: 'esnext'
	},
	plugins: [wasm(), tailwindcss(), sveltekit()],
	ssr: {
		noExternal: ['@cooklang/cooklang']
	},
	optimizeDeps: {
		exclude: ['@cooklang/cooklang']
	},
	test: {
		projects: [
			{
				extends: './vite.config.ts',
				test: {
					name: 'server',
					environment: 'node',
					include: ['src/**/*.test.ts'],
					exclude: ['src/**/*.svelte.test.ts']
				}
			},
			{
				extends: './vite.config.ts',
				test: {
					name: 'client',
					environment: 'jsdom',
					include: ['src/**/*.svelte.test.ts'],
					setupFiles: ['./vitest-setup-client.ts']
				}
			}
		]
	}
});
