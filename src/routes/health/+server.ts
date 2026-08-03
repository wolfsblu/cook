/**
 * Health endpoint, used by the container healthcheck.
 *
 * Reports whether the recipe directory is actually readable rather than just
 * whether the process is alive: a missing or misconfigured volume mount is the
 * failure mode that otherwise looks like an empty library.
 */

import { json } from '@sveltejs/kit';
import { spawn } from 'node:child_process';
import type { RequestHandler } from './$types';
import { config } from '$lib/server/config.js';
import { getIndex } from '$lib/server/recipes/index.js';

/** Whether the Cook CLI can be executed. Cached: this spawns a process. */
let cookCliStatus: 'ok' | 'missing' | null = null;

async function checkCookCli(): Promise<'ok' | 'missing'> {
	if (cookCliStatus) return cookCliStatus;

	cookCliStatus = await new Promise<'ok' | 'missing'>((resolve) => {
		const proc = spawn(config.COOK_CLI_PATH, ['--version']);
		proc.on('error', () => resolve('missing'));
		proc.on('close', (code) => resolve(code === 0 ? 'ok' : 'missing'));
	});

	return cookCliStatus;
}

export const GET: RequestHandler = async () => {
	const [index, cookCli] = await Promise.all([getIndex(), checkCookCli()]);

	// The recipe directory being unreadable is the only fatal condition. A
	// missing Cook CLI degrades the shopping list but leaves the app usable, so
	// it is reported without failing the check.
	const ok = index.readable;

	return json(
		{
			ok,
			recipePath: config.RECIPE_PATH,
			recipeCount: index.entries.length,
			cookCli
		},
		{ status: ok ? 200 : 503 }
	);
};
