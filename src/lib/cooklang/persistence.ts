/**
 * File persistence layer for shopping list
 * Handles reading/writing .shopping-list.json in the recipe directory
 */

import fs from 'node:fs/promises';
import path from 'node:path';
import { config } from '$lib/server/config.js';
import type { RecipeSelection } from '$lib/types/shopping-list.js';

/**
 * Shopping list file structure
 */
interface ShoppingListFile {
	recipes: RecipeSelection[];
}

/**
 * Get the absolute path to the shopping list file
 */
function getShoppingListPath(): string {
	const recipePath = config.RECIPE_PATH;
	return path.join(recipePath, '.shopping-list.json');
}

/**
 * Load shopping list selections from file
 *
 * @returns Array of recipe selections, empty if file doesn't exist
 * @throws {Error} If file exists but cannot be read or parsed
 */
export async function loadShoppingListFile(): Promise<RecipeSelection[]> {
	const filePath = getShoppingListPath();

	try {
		const content = await fs.readFile(filePath, 'utf-8');
		const data = JSON.parse(content) as ShoppingListFile;

		// Validate structure
		if (!data.recipes || !Array.isArray(data.recipes)) {
			console.warn('Invalid shopping list file structure, treating as empty');
			return [];
		}

		return data.recipes;
	} catch (error) {
		// File doesn't exist or is empty
		if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
			return [];
		}

		// JSON parse error
		if (error instanceof SyntaxError) {
			console.error('Shopping list file is corrupted, treating as empty:', error);
			return [];
		}

		// Other errors (permissions, etc.)
		throw error;
	}
}

/**
 * Save shopping list selections to file
 * Uses atomic write (write to temp file, then rename)
 *
 * @param recipes - Array of recipe selections to save
 * @throws {Error} If file cannot be written
 */
export async function saveShoppingListFile(recipes: RecipeSelection[]): Promise<void> {
	const filePath = getShoppingListPath();
	const tempPath = `${filePath}.tmp`;

	const data: ShoppingListFile = { recipes };
	const content = JSON.stringify(data, null, 2);

	try {
		// Write to temp file
		await fs.writeFile(tempPath, content, 'utf-8');

		// Atomically rename (overwrites existing file)
		await fs.rename(tempPath, filePath);
	} catch (error) {
		// Clean up temp file if it exists
		try {
			await fs.unlink(tempPath);
		} catch {
			// Ignore cleanup errors
		}

		throw error;
	}
}

/**
 * Add or update a recipe in the shopping list file
 *
 * @param recipe - Recipe selection to add or update
 * @returns Updated array of all recipe selections
 * @throws {Error} If file operations fail
 */
export async function addRecipeToFile(recipe: RecipeSelection): Promise<RecipeSelection[]> {
	const recipes = await loadShoppingListFile();

	// Find existing recipe by slug
	const existingIndex = recipes.findIndex((r) => r.slug === recipe.slug);

	if (existingIndex >= 0) {
		// Update existing recipe
		recipes[existingIndex] = recipe;
	} else {
		// Add new recipe
		recipes.push(recipe);
	}

	await saveShoppingListFile(recipes);
	return recipes;
}

/**
 * Remove a recipe from the shopping list file
 *
 * @param slug - Recipe slug to remove
 * @returns Updated array of remaining recipe selections
 * @throws {Error} If file operations fail
 */
export async function removeRecipeFromFile(slug: string): Promise<RecipeSelection[]> {
	const recipes = await loadShoppingListFile();
	const filtered = recipes.filter((r) => r.slug !== slug);

	await saveShoppingListFile(filtered);
	return filtered;
}

/**
 * Update the scale of a recipe in the shopping list file
 *
 * @param slug - Recipe slug to update
 * @param scale - New scale value
 * @returns Updated array of all recipe selections
 * @throws {Error} If file operations fail or recipe not found
 */
export async function updateRecipeScale(slug: string, scale: number): Promise<RecipeSelection[]> {
	const recipes = await loadShoppingListFile();
	const recipe = recipes.find((r) => r.slug === slug);

	if (!recipe) {
		throw new Error(`Recipe not found in shopping list: ${slug}`);
	}

	recipe.scale = scale;

	await saveShoppingListFile(recipes);
	return recipes;
}

/**
 * Clear all recipes from the shopping list
 * Deletes the .shopping-list.json file
 *
 * @throws {Error} If file deletion fails (except ENOENT)
 */
export async function clearShoppingListFile(): Promise<void> {
	const filePath = getShoppingListPath();

	try {
		await fs.unlink(filePath);
	} catch (error) {
		// Ignore error if file doesn't exist
		if ((error as NodeJS.ErrnoException).code !== 'ENOENT') {
			throw error;
		}
	}
}
