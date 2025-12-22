import { sveltekit } from "@sveltejs/kit/vite";
import { defineConfig } from "vite";
import tailwindcss from "@tailwindcss/vite";
import type { ViteDevServer } from 'vite';

const webSocketServer = {
	name: 'webSocketServer',
	configureServer(server: ViteDevServer) {
		if (!server.httpServer) return;

		import('./src/lib/server/socket.ts').then(({ initializeSocketIO }) => {
			initializeSocketIO(server.httpServer!);
			console.log('Socket.IO initialized in dev mode');
		});
	}
};

export default defineConfig({
	plugins: [tailwindcss(), sveltekit(), webSocketServer],
	server: {
		allowedHosts: [
			'beta.tukoo.web.id',
			'.beta.tukoo.web.id', // Allow 
			'tukoo.web.id',
			'.tukoo.web.id', // Allow all subdomains
			'tukoo.test',
			'.tukoo.test', // Allow all subdomains
			'localhost',
			'example.test',
			'127.0.0.1'
		],
		host: true // Allow external connections
	}
});