/**
 * Recipe image URLs.
 *
 * Images are served straight off the recipe directory, which lives on a
 * spinning-disk NAS. This module decides where the browser is pointed.
 *
 * In production an imgproxy sidecar resizes and re-encodes them, and a caching
 * reverse proxy sits in front so repeat requests never reach the disk. When no
 * imgproxy is configured -- local development, or the app run on its own -- the
 * URLs fall back to an internal route that streams the original bytes, so the
 * app is fully usable without the rest of the stack.
 */

import type { RecipeImage } from './recipes/index.js';
import type { ImageRef } from '$lib/types/recipe.js';
import { IMGPROXY_ENABLED, imgproxyUrl } from './imgproxy.js';

export type ImagePreset = 'thumb' | 'card' | 'hero' | 'step';

interface PresetSpec {
	width: number;
	height: number;
	fit: 'fill' | 'fit';
	/** Extra widths offered via srcset, as multiples of the base width. */
	densities: number[];
}

/**
 * Target boxes per preset. `card` and `hero` match the aspect ratios their
 * components render at, so images occupy exactly the space reserved for them
 * and nothing shifts as they load.
 */
export const PRESETS: Record<ImagePreset, PresetSpec> = {
	thumb: { width: 96, height: 96, fit: 'fill', densities: [1, 2] },
	card: { width: 480, height: 360, fit: 'fill', densities: [1, 2] },
	hero: { width: 1200, height: 514, fit: 'fill', densities: [1, 2] },
	step: { width: 800, height: 600, fit: 'fit', densities: [1, 2] }
};

/** URL for the built-in fallback route, which streams the original file. */
function fallbackUrl(image: RecipeImage): string {
	const encoded = image.key.split('/').map(encodeURIComponent).join('/');
	return `/api/recipes/image/${encoded}?v=${image.mtimeMs}`;
}

/**
 * Build the image reference for a preset.
 *
 * @param image the image to serve, or null when the recipe has none
 */
export function imageRef(image: RecipeImage | null, preset: ImagePreset): ImageRef | null {
	if (!image) return null;

	const spec = PRESETS[preset];

	if (!IMGPROXY_ENABLED) {
		// One original for every density: there is nothing to resize with.
		return { src: fallbackUrl(image), width: spec.width, height: spec.height };
	}

	const url = (dpr: number) =>
		imgproxyUrl(image.key, {
			width: spec.width,
			height: spec.height,
			fit: spec.fit,
			cacheBuster: image.mtimeMs,
			dpr
		});

	return {
		src: url(1),
		srcset: spec.densities.map((dpr) => `${url(dpr)} ${dpr}x`).join(', '),
		width: spec.width,
		height: spec.height
	};
}
