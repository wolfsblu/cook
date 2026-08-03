/**
 * Server-side configuration, read from the environment at runtime.
 *
 * Uses $env/dynamic/private so values come from the process environment when
 * the container starts rather than being baked in at build time.
 */

import { dev } from '$app/environment';
import { env } from '$env/dynamic/private';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../..');

function resolveFromRoot(p: string): string {
	return path.isAbsolute(p) ? p : path.resolve(projectRoot, p);
}

function intFromEnv(value: string | undefined, fallback: number): number {
	const parsed = Number.parseInt(value ?? '', 10);
	return Number.isFinite(parsed) ? parsed : fallback;
}

export const config = {
	/** Directory holding .cook files. Mounted from the NAS in production. */
	RECIPE_PATH: resolveFromRoot(env.RECIPE_PATH || './recipes'),

	/** Cook CLI binary. Expected on PATH unless overridden. */
	COOK_CLI_PATH: env.COOK_CLI_PATH || 'cook',

	/** Timeout for Cook CLI subprocesses, in milliseconds. */
	COOK_CLI_TIMEOUT: intFromEnv(env.COOK_CLI_TIMEOUT, 30_000),

	/**
	 * How long the recipe index may serve results before re-stat'ing the
	 * recipe directory.
	 *
	 * Zero in dev so edits show up on the next request. In production the
	 * recipe directory is a spinning-disk NAS mount, where a rescan costs one
	 * stat per file, so we trade a little staleness for far less disk chatter.
	 */
	RECIPE_INDEX_TTL_MS: intFromEnv(env.RECIPE_INDEX_TTL_MS, dev ? 0 : 30_000)
};

/**
 * AISLE_CONFIG_PATH used to be read here and passed to the CLI as `-a`. It was
 * never set anywhere, and the CLI turns out to auto-discover
 * <recipe dir>/config/aisle.conf on its own -- which is why categories worked
 * regardless. The setting was doing nothing, so it is gone.
 */
