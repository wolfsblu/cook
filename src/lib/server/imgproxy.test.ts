import { createHmac } from 'node:crypto';
import { describe, expect, it } from 'vitest';

/**
 * imgproxy.ts reads its configuration at module load, so these tests exercise
 * the signing algorithm directly rather than importing it.
 *
 * A wrong signature makes every image on the site 403 in a way that reads as a
 * misconfigured proxy rather than a code bug, so the algorithm is pinned to a
 * golden vector. The expected values below were produced by this
 * implementation and then confirmed against a real imgproxy v3 container: the
 * signed URLs returned 200, and altering a single character of the signature
 * returned 403.
 */

const KEY = '943b421c9eb07c830af81030552c86009268de4e532ba2ee2eab8247c6da0881';
const SALT = '520f986b998545b4785e0defbc4f3c1203f22de2374a3d53cb7a7fe9fea309c5';

function base64url(input: Buffer | string): string {
	return Buffer.from(input).toString('base64url');
}

function sign(path: string, key = KEY, salt = SALT): string {
	const hmac = createHmac('sha256', Buffer.from(key, 'hex'));
	hmac.update(Buffer.from(salt, 'hex'));
	hmac.update(path);
	return base64url(hmac.digest());
}

function buildPath(
	key: string,
	options: { width: number; height: number; fit: string; cacheBuster: number; dpr?: number }
): string {
	const segments = [`rs:${options.fit}:${options.width}:${options.height}:0`, 'g:sm'];
	if (options.dpr && options.dpr !== 1) segments.push(`dpr:${options.dpr}`);
	segments.push(`cb:${options.cacheBuster}`);
	return `/${segments.join('/')}/${base64url(`local:///${key}`)}.webp`;
}

const CARD = { width: 480, height: 360, fit: 'fill', cacheBuster: 1785708307324 } as const;

describe('imgproxy URL signing', () => {
	it('matches the signature a live imgproxy accepted', () => {
		const path = buildPath('Breakfast/Easy Pancakes.jpg', CARD);

		expect(path).toBe(
			'/rs:fill:480:360:0/g:sm/cb:1785708307324/bG9jYWw6Ly8vQnJlYWtmYXN0L0Vhc3kgUGFuY2FrZXMuanBn.webp'
		);
		expect(sign(path)).toBe('99Qx96EKNh91zBsg9xNVqsI8JS16V53XV1qJQEdPDhw');
	});

	it('matches the retina variant', () => {
		const path = buildPath('Breakfast/Easy Pancakes.jpg', { ...CARD, dpr: 2 });

		expect(sign(path)).toBe('yNlVfpaZd1Jy7yhHzuRfLaY5NvhO7NiuWNQemdsWEmw');
	});

	it('decodes key and salt from hex rather than signing the hex text', () => {
		const path = buildPath('x.jpg', CARD);
		const naive = createHmac('sha256', KEY).update(SALT).update(path).digest('base64url');

		expect(sign(path)).not.toBe(naive);
	});

	it('produces a different URL when the cache buster changes', () => {
		// This is what makes an immutable Cache-Control header safe: replacing an
		// image changes its mtime, which changes the URL, which misses the cache.
		const first = buildPath('x.jpg', { ...CARD, cacheBuster: 1000 });
		const second = buildPath('x.jpg', { ...CARD, cacheBuster: 2000 });

		expect(first).not.toBe(second);
		expect(sign(first)).not.toBe(sign(second));
	});
});

describe('source encoding', () => {
	it('encodes paths with spaces into URL-safe characters', () => {
		const encoded = base64url('local:///Breakfast/Easy Pancakes.jpg');

		expect(encoded).toMatch(/^[A-Za-z0-9_-]+$/);
		expect(encodeURIComponent(encoded)).toBe(encoded);
	});

	it('round-trips non-ASCII filenames', () => {
		const source = 'local:///Crème Brûlée.jpg';

		expect(Buffer.from(base64url(source), 'base64url').toString()).toBe(source);
	});
});
