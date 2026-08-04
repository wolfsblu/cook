import { CookingPotIcon, RefrigeratorIcon, ShoppingCartIcon, SignpostIcon } from '@lucide/svelte';

/** Shared by the mobile tab bar and the desktop rail, so they cannot drift. */
export const NAV_LINKS = [
	{ label: 'Recipes', href: '/', icon: CookingPotIcon },
	{ label: 'Shopping', href: '/shopping', icon: ShoppingCartIcon },
	// Aisles sits next to Shopping because it shapes that list, and is the page
	// you arrive at from it when something lands under "Other".
	{ label: 'Aisles', href: '/aisles', icon: SignpostIcon },
	{ label: 'Pantry', href: '/pantry', icon: RefrigeratorIcon }
] as const;
