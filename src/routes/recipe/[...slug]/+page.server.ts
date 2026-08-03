import { error } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';
import { getEntry } from '$lib/server/recipes/index.js';
import { clampScale, getRecipeDisplay } from '$lib/server/recipes/parse.js';
import { imageRef } from '$lib/server/images.js';
import { readSelections } from '$lib/server/shopping/store.js';

export const load: PageServerLoad = async ({ params, url }) => {
	// The slug is looked up in the index rather than joined onto a path. Nothing
	// a visitor types reaches the filesystem, so "../.." resolves to a 404 here
	// instead of reading an arbitrary file as the previous route did.
	const entry = await getEntry(params.slug);
	if (!entry) {
		throw error(404, 'Recipe not found');
	}

	const scale = clampScale(url.searchParams.get('scale'));
	const [recipe, selections] = await Promise.all([
		getRecipeDisplay(entry, scale),
		readSelections()
	]);

	// Membership is resolved here rather than in a client store, so the button
	// is correct on first paint instead of always reading "Add".
	const selection = selections.find((s) => s.slug === entry.slug);

	return {
		recipe,
		inShoppingList: selection !== undefined,
		listedScale: selection?.scale ?? null,
		image: imageRef(entry.image, 'hero'),
		stepImages: Object.fromEntries(
			Object.entries(entry.stepImages).map(([step, image]) => [step, imageRef(image, 'step')])
		),
		scale,
		slug: entry.slug,
		relPath: entry.relPath
	};
};
