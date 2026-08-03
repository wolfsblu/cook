/**
 * Fallback image route.
 *
 * Used when no imgproxy is configured, so the app still shows pictures when run
 * on its own. It streams originals; it does not resize.
 *
 * The previous version took a recipe slug, joined it onto the recipe path
 * unvalidated, and probed four extensions with a readFile-and-catch loop --
 * up to four failed syscalls per miss, on a spinning disk, plus a traversal
 * hole. This one only serves paths the index already found.
 */

import { error } from '@sveltejs/kit';
import { createReadStream } from 'node:fs';
import { Readable } from 'node:stream';
import path from 'node:path';
import type { RequestHandler } from './$types';
import { config } from '$lib/server/config.js';
import { getIndex } from '$lib/server/recipes/index.js';

const MIME_TYPES: Record<string, string> = {
	'.jpg': 'image/jpeg',
	'.jpeg': 'image/jpeg',
	'.png': 'image/png',
	'.webp': 'image/webp'
};

/** Every image key the index knows about, with its mtime and size. */
async function findImage(key: string) {
	const index = await getIndex();

	for (const entry of index.entries) {
		if (entry.image?.key === key) return entry.image;

		for (const stepImage of Object.values(entry.stepImages)) {
			if (stepImage.key === key) return stepImage;
		}
	}

	return null;
}

export const GET: RequestHandler = async ({ params, request, setHeaders }) => {
	const key = params.key;

	// Membership in the index is the whole authorization check: an arbitrary
	// path cannot be requested because it was never indexed.
	const image = await findImage(key);
	if (!image) {
		throw error(404, 'Recipe image not found');
	}

	const extension = path.extname(key).toLowerCase();
	const contentType = MIME_TYPES[extension];
	if (!contentType) {
		throw error(404, 'Unsupported image type');
	}

	const etag = `W/"${image.mtimeMs}"`;
	if (request.headers.get('if-none-match') === etag) {
		return new Response(null, { status: 304, headers: { ETag: etag } });
	}

	setHeaders({
		'Content-Type': contentType,
		ETag: etag,
		// The URL carries the mtime, so a given URL's bytes never change.
		'Cache-Control': 'public, max-age=31536000, immutable'
	});

	// Stream rather than buffering the whole file into memory, which matters
	// for full-resolution photographs read over a network mount.
	const stream = createReadStream(path.join(config.RECIPE_PATH, key));
	return new Response(Readable.toWeb(stream) as ReadableStream);
};
