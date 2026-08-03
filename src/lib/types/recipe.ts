export interface IngredientDisplay {
	index: number;
	name: string;
	quantity: string | null;
	note: string | null;
}

export interface CookwareDisplay {
	index: number;
	name: string;
	quantity: string | null;
	note: string | null;
}

export interface TimerDisplay {
	type: 'timer';
	index: number;
	name: string | null;
	quantity: string | null;
}

export interface TextItem {
	type: 'text';
	value: string;
}

export interface IngredientItem {
	type: 'ingredient';
	index: number;
	name: string;
	quantity: string | null;
}

export interface CookwareItem {
	type: 'cookware';
	index: number;
	name: string;
	quantity: string | null;
}

export interface InlineQuantityItem {
	type: 'inlineQuantity';
	index: number;
	quantity: string;
}

export type StepItem = TextItem | IngredientItem | CookwareItem | TimerDisplay | InlineQuantityItem;

export interface StepDisplay {
	type: 'step';
	number: number;
	items: StepItem[];
}

export interface TextContent {
	type: 'text';
	value: string;
}

export type ContentDisplay = StepDisplay | TextContent;

export interface SectionDisplay {
	name: string | null;
	content: ContentDisplay[];
}

export interface RecipeDisplay {
	title?: string;
	description?: string;
	tags: string[];
	author?: { name?: string; url?: string };
	source?: { name?: string; url?: string };
	servings?: number | string;
	time?: number | { prep_time?: number; cook_time?: number };
	ingredients: IngredientDisplay[];
	cookware: CookwareDisplay[];
	sections: SectionDisplay[];
	imageUrl?: string;
}

export interface ActiveTimer {
	id: string;
	name: string;
	totalSeconds: number;
	remainingSeconds: number;
	status: 'running' | 'paused';
	stepNumber: number;
}
