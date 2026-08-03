import { CookingPotIcon, RefrigeratorIcon, ShoppingCartIcon } from '@lucide/svelte';

/** Shared by the mobile tab bar and the desktop rail, so they cannot drift. */
export const NAV_LINKS = [
	{ label: 'Recipes', href: '/', icon: CookingPotIcon },
	{ label: 'Shopping', href: '/shopping', icon: ShoppingCartIcon },
	{ label: 'Pantry', href: '/pantry', icon: RefrigeratorIcon }
] as const;
