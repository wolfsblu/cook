/**
 * Pantry file access.
 *
 * The pantry lives at <recipes>/config/pantry.conf, which is exactly where the
 * Cook CLI looks for it. Writing there means the CLI subtracts stocked
 * ingredients from generated shopping lists with no further wiring -- verified
 * against cookcli 0.19.3, where `shopping-list` discovers the file and applies
 * it unconditionally.
 */

import fs from 'node:fs/promises';
import path from 'node:path';
import { config } from '../config.js';

export function pantryPath(): string {
	return path.join(config.RECIPE_PATH, 'config', 'pantry.conf');
}

/**
 * mtime of the pantry file, used as part of the shopping list's cache key so
 * that editing stock invalidates the generated list. Zero when absent.
 */
export async function pantryMtimeMs(): Promise<number> {
	try {
		return Math.round((await fs.stat(pantryPath())).mtimeMs);
	} catch {
		return 0;
	}
}
