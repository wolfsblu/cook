import { env } from '$env/dynamic/private';
import { error } from '@sveltejs/kit';
import fs from 'node:fs/promises';
import path from 'node:path';
import type { RequestHandler } from './$types';

const SUPPORTED_EXTENSIONS = ['.jpg', '.jpeg', '.png', '.webp'];
const MIME_TYPES: Record<string, string> = {
	'.jpg': 'image/jpeg',
	'.jpeg': 'image/jpeg',
	'.png': 'image/png',
	'.webp': 'image/webp'
};

export const GET: RequestHandler = async ({ params }) => {
	const recipePath = env.RECIPE_PATH || './recipes';
	const slug = params.slug;

	// Remove .cook extension if present
	const baseName = slug.replace(/\.cook$/, '');

	// Try each supported extension
	for (const ext of SUPPORTED_EXTENSIONS) {
		const imagePath = path.join(recipePath, baseName + ext);
		try {
			const imageBuffer = await fs.readFile(imagePath);
			return new Response(imageBuffer, {
				headers: {
					'Content-Type': MIME_TYPES[ext],
					'Cache-Control': 'public, max-age=3600'
				}
			});
		} catch {
			// Try next extension
			continue;
		}
	}

	// No image found
	throw error(404, 'Recipe image not found');
};
