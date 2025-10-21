import { sveltekit } from "@sveltejs/kit/vite";
import { defineConfig } from "vite";
import tailwindcss from "@tailwindcss/vite";

export default defineConfig({
	plugins: [tailwindcss(), sveltekit()],
	server: {
		allowedHosts: [
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