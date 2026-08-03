/**
 * imgproxy URL construction.
 *
 * imgproxy reads the recipe directory directly over a read-only mount and
 * resizes on demand; a caching reverse proxy in front of it means a given
 * derivative is produced once and then served from cache, so the NAS is not
 * touched again. The app never handles image bytes when this is configured.
 *
 * URLs are signed. Without a signature anyone on the network could use the
 * instance as an open image resizer, which is both a bandwidth and a
 * decompression-bomb concern.
 */

import { createHmac } from 'node:crypto';
import { env } from '$env/dynamic/private';

/** Base64url, which is what imgproxy expects for encoded source URLs and signatures. */
function base64url(input: Buffer | string): string {
	return Buffer.from(input).toString('base64url');
}

const KEY = env.IMGPROXY_KEY ?? '';
const SALT = env.IMGPROXY_SALT ?? '';
const BASE_URL = (env.IMGPROXY_BASE_URL ?? '').replace(/\/+$/, '');

/**
 * Whether imgproxy is configured. When false the caller falls back to the
 * app's own image route, so development works without the full stack.
 */
export const IMGPROXY_ENABLED = Boolean(BASE_URL && KEY && SALT);

if (BASE_URL && !(KEY && SALT)) {
	console.warn(
		'IMGPROXY_BASE_URL is set but IMGPROXY_KEY/IMGPROXY_SALT are not. ' +
			'Falling back to serving original images from the app.'
	);
}

/**
 * Sign a processing path.
 *
 * The key and salt are hex-encoded in the environment and must be decoded to
 * raw bytes before use; signing the hex text instead produces a signature
 * imgproxy rejects with a 403 that looks like a configuration problem.
 */
function sign(path: string): string {
	const hmac = createHmac('sha256', Buffer.from(KEY, 'hex'));
	hmac.update(Buffer.from(SALT, 'hex'));
	hmac.update(path);
	return base64url(hmac.digest());
}

export interface ImgproxyOptions {
	width: number;
	height: number;
	/** `fill` crops to the exact box; `fit` preserves the whole image. */
	fit: 'fill' | 'fit';
	/**
	 * Cache buster, in practice the source file's mtime. It does not affect
	 * processing -- it only changes the URL, which is what lets the cache in
	 * front of imgproxy mark responses immutable: replacing an image changes
	 * its mtime, which changes the URL, which misses the cache.
	 */
	cacheBuster: number;
	/** Device pixel ratio, for retina variants. */
	dpr?: number;
}

/**
 * Build a signed imgproxy URL for a file inside the recipe directory.
 *
 * @param key path relative to the recipe directory
 */
export function imgproxyUrl(key: string, options: ImgproxyOptions): string {
	const { width, height, fit, cacheBuster, dpr } = options;

	// The source is base64-encoded rather than passed as /plain/. Recipe
	// filenames contain spaces and percent signs, which /plain/ handles badly.
	const encodedSource = base64url(`local:///${key}`);

	const segments = [
		`rs:${fit}:${width}:${height}:0`,
		// Smart gravity: keep the interesting part of the photo when cropping.
		'g:sm'
	];

	if (dpr && dpr !== 1) segments.push(`dpr:${dpr}`);
	segments.push(`cb:${cacheBuster}`);

	// An explicit .webp extension rather than relying on automatic format
	// negotiation, so the URL is deterministic and the cache in front needs no
	// Vary: Accept.
	const processingPath = `/${segments.join('/')}/${encodedSource}.webp`;

	return `${BASE_URL}/${sign(processingPath)}${processingPath}`;
}
