#!/usr/bin/env node
/**
 * Checks the behaviour this app relies on from the Cook CLI.
 *
 * These are assumptions, not implementation details: if a CLI upgrade changes
 * any of them, the shopping list or the pantry stops working in a way unit
 * tests cannot catch, because they all mock the binary away. Run this against
 * a real binary and real recipes after bumping COOK_CLI_VERSION.
 *
 *   docker compose run --rm app node scripts/smoke-cook.mjs
 *
 * Exits non-zero on the first failed assumption.
 */

import { spawn } from 'node:child_process';
import { cp, mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';

const COOK = process.env.COOK_CLI_PATH ?? 'cook';
const RECIPES = process.env.RECIPE_PATH ?? './recipes';

let failures = 0;

function check(name, passed, detail = '') {
	console.log(`${passed ? 'ok  ' : 'FAIL'}  ${name}${detail ? ` — ${detail}` : ''}`);
	if (!passed) failures++;
}

function run(args, cwd) {
	return new Promise((resolve) => {
		const proc = spawn(COOK, args, { cwd });
		let stdout = '';
		let stderr = '';
		proc.stdout.on('data', (d) => (stdout += d));
		proc.stderr.on('data', (d) => (stderr += d));
		proc.on('error', (error) => resolve({ code: -1, stdout, stderr: String(error) }));
		proc.on('close', (code) => resolve({ code, stdout, stderr }));
	});
}

const names = (json) => {
	try {
		return JSON.parse(json).flatMap((c) => c.items.map((i) => i.name));
	} catch {
		return [];
	}
};

const work = await mkdtemp(path.join(tmpdir(), 'cook-smoke-'));

try {
	await cp(RECIPES, work, { recursive: true });

	const version = await run(['--version'], work);
	check(
		'the CLI is executable',
		version.code === 0,
		version.stdout.trim() || version.stderr.trim()
	);
	if (version.code !== 0) process.exit(1);

	// Recipes in subdirectories must resolve, and `:n` must scale them.
	const single = await run(['shopping-list', './Breakfast/Easy Pancakes.cook', '-f', 'json'], work);
	const doubled = await run(
		['shopping-list', './Breakfast/Easy Pancakes.cook:2', '-f', 'json'],
		work
	);
	check('recipes in subdirectories resolve', names(single.stdout).includes('flour'));
	check(
		'the :n suffix scales quantities',
		/250(\.0)?/.test(doubled.stdout) && /125(\.0)?/.test(single.stdout)
	);

	// --base-path must work, since the app does not rely on the process cwd.
	const based = await run(
		['shopping-list', '--base-path', work, 'Breakfast/Easy Pancakes.cook', '-f', 'json'],
		'/'
	);
	check('--base-path resolves recipes from elsewhere', names(based.stdout).includes('flour'));

	// Recipe references must expand into their ingredients.
	const referenced = await run(['shopping-list', './Neapolitan Pizza.cook', '-f', 'json'], work);
	check(
		'recipe references expand',
		names(referenced.stdout).some((n) => /yeast/i.test(n))
	);

	// Aisle categories must be discovered without being passed explicitly.
	const categories = JSON.parse(single.stdout || '[]').map((c) => c.category);
	check(
		'config/aisle.conf is auto-discovered',
		categories.includes('tinned goods and baking'),
		categories.join(', ')
	);

	// The pantry must be auto-discovered and subtracted. This is what the whole
	// pantry feature rests on: the app only edits the file.
	// The pantry file is replaced outright rather than appended to, so the
	// result cannot depend on whatever the real pantry happens to contain.
	const pantryPath = path.join(work, 'config', 'pantry.conf');
	const original = await readFile(pantryPath, 'utf8');

	await writeFile(pantryPath, '[smoke]\nflour = "2000%g"\n');
	const stocked = await run(
		['shopping-list', './Breakfast/Easy Pancakes.cook', '-f', 'json'],
		work
	);
	check(
		'config/pantry.conf is subtracted automatically',
		!names(stocked.stdout).includes('flour'),
		names(stocked.stdout).join(', ')
	);

	// A unit that cannot be matched must warn rather than silently subtract.
	await writeFile(pantryPath, '[smoke]\nflour = "2%kg"\n');
	const mismatched = await run(
		['shopping-list', './Breakfast/Easy Pancakes.cook', '-f', 'json'],
		work
	);
	check(
		'a unit mismatch warns instead of subtracting',
		/WARN/.test(mismatched.stderr) &&
			/flour/i.test(mismatched.stderr) &&
			names(mismatched.stdout).includes('flour'),
		mismatched.stderr.trim().split('\n')[0] ?? ''
	);

	await writeFile(pantryPath, original);
} finally {
	await rm(work, { recursive: true, force: true });
}

console.log(failures === 0 ? '\nAll assumptions hold.' : `\n${failures} assumption(s) broken.`);
process.exit(failures === 0 ? 0 : 1);
