// @ts-check
import { defineConfig } from 'astro/config';

// https://astro.build/config
export default defineConfig({
	// Match Vercel's primary domain for sitemap, robots and canonical URLs.
	site: 'https://www.darwinlatorre.com',
	// The dev toolbar sits over the bottom of the page and blocks the mobile drawer terminal.
	devToolbar: { enabled: false },
});
