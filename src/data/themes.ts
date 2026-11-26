// Swatch colors mirror the tokens in styles/variables.css for each theme.
export const themes = [
	{ id: 'violet', label: 'Violet', accent: '#a96ed3', background: '#0c0c11' },
	{ id: 'blue', label: 'Blue', accent: '#6b93c4', background: '#070a0f' },
	{ id: 'mono', label: 'Mono', accent: '#d0d6e0', background: '#08090a' },
] as const;

export type ThemeId = (typeof themes)[number]['id'];

export const defaultTheme: ThemeId = 'violet';

export const themeStorageKey = 'portfolio-theme';

export const isThemeId = (value: string): value is ThemeId =>
	themes.some(({ id }) => id === value);
