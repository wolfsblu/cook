import { CooklangParser, HTMLRenderer } from '@cooklang/cooklang';
import type { PageServerLoad } from './$types';
import fs from 'node:fs/promises';
import path from 'node:path';
import { env } from '$env/dynamic/private';
import { searchRecipes } from '$lib/cooklang/cli.js';

const readFiles = async (directory: string, extension: string, filenames?: string[]) => {
	const files = await fs.readdir(directory);
	let matchedFiles = files.filter((file) => path.extname(file) === extension);

	// If specific filenames are provided, filter to only those
	if (filenames && filenames.length > 0) {
		matchedFiles = matchedFiles.filter((file) => filenames.includes(file));
	}

	return Promise.all(
		matchedFiles.map(async (file) => {
			const filePath = path.join(directory, file);
			const content = await fs.readFile(filePath, 'utf8');
			return { filename: file, content: content };
		})
	);
};

export const load: PageServerLoad = async ({ url }) => {
	const recipePath = env.RECIPE_PATH || './recipes';
	const searchQuery = url.searchParams.get('q');

	try {
		let recipeFiles;

		if (searchQuery) {
			// Use Cook CLI search to find matching recipes
			try {
				const matchedFilenames = await searchRecipes(searchQuery, recipePath);
				recipeFiles = await readFiles(recipePath, '.cook', matchedFilenames);
			} catch (searchError) {
				// If search fails, fall back to loading all recipes
				console.error('Cook CLI search failed, loading all recipes:', searchError);
				recipeFiles = await readFiles(recipePath, '.cook');
			}
		} else {
			// Load all recipes (default behavior)
			recipeFiles = await readFiles(recipePath, '.cook');
		}

		const parser = new CooklangParser();
		const renderer = new HTMLRenderer();
		const recipes = recipeFiles.map((file) => {
			const [recipe, report] = parser.parse(file.content);
			const markup = renderer.render(recipe);

			return {
				filename: file.filename,
				content: file.content,
				markup,
				report,
				parsed: structuredClone(recipe),
				imageUrl: `/api/recipes/${file.filename}/image`
			};
		});

		return {
			recipes,
			searchQuery: searchQuery || ''
		};
	} catch (error) {
		console.error('Failed to read recipes directory:', error);
		return {
			recipes: [],
			searchQuery: searchQuery || '',
			error: `Unable to load recipes from "${recipePath}". Please check that the directory exists.`
		};
	}
};
