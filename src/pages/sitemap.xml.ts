import type { APIRoute } from 'astro';

// Single-page site: one URL, dated by the build so crawlers can tell when it changed.
export const GET: APIRoute = ({ site }) => {
	const lastModified = new Date().toISOString().slice(0, 10);
	return new Response(
		`<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"><url><loc>${new URL('/', site).href}</loc><lastmod>${lastModified}</lastmod></url></urlset>`,
		{ headers: { 'Content-Type': 'application/xml; charset=utf-8' } },
	);
};
