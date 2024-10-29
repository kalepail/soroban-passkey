import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vite';
import { nodePolyfills } from 'vite-plugin-node-polyfills'

export default defineConfig({
	server: {
		
	},
	plugins: [
		nodePolyfills({include: ['buffer', 'stream', 'util']}), 
		sveltekit()
	],
});
