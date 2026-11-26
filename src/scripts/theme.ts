import { defaultTheme, isThemeId, themes, themeStorageKey, type ThemeId } from '../data/themes';

declare global {
	interface DocumentEventMap {
		'portfolio:theme-change': CustomEvent<{ theme: ThemeId }>;
	}
}

const transitionDuration = 300;
let transitionTimer = 0;

export const getTheme = (): ThemeId => {
	const theme = document.documentElement.dataset.theme;
	return theme && isThemeId(theme) ? theme : defaultTheme;
};

const syncThemeColor = (theme: ThemeId) => {
	const meta = document.querySelector<HTMLMetaElement>('meta[name="theme-color"]');
	const background = themes.find(({ id }) => id === theme)?.background;
	if (meta && background) meta.content = background;
};

export const applyTheme = (theme: ThemeId) => {
	const root = document.documentElement;
	if (!window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
		// Colors cross-fade briefly instead of snapping.
		root.classList.add('theme-transition');
		window.clearTimeout(transitionTimer);
		transitionTimer = window.setTimeout(() => root.classList.remove('theme-transition'), transitionDuration);
	}
	if (theme === defaultTheme) delete root.dataset.theme;
	else root.dataset.theme = theme;
	try {
		localStorage.setItem(themeStorageKey, theme);
	} catch {
		// Storage can be unavailable (private mode); the theme still applies for this visit.
	}
	syncThemeColor(theme);
	document.dispatchEvent(new CustomEvent('portfolio:theme-change', { detail: { theme } }));
};

const initializeThemeSwitcher = (switcher: HTMLElement) => {
	if (switcher.dataset.interactionsReady === 'true') return;
	switcher.dataset.interactionsReady = 'true';

	const trigger = switcher.querySelector<HTMLButtonElement>('[data-theme-trigger]');
	const panel = switcher.querySelector<HTMLElement>('[data-theme-options]');
	const options = switcher.querySelectorAll<HTMLButtonElement>('[data-theme-option]');
	const abortController = new AbortController();
	const { signal } = abortController;

	const syncOptions = () => {
		const current = getTheme();
		for (const option of options) option.setAttribute('aria-pressed', String(option.dataset.themeOption === current));
	};
	const setOpen = (open: boolean) => {
		if (!trigger || !panel) return;
		switcher.classList.toggle('is-open', open);
		trigger.setAttribute('aria-expanded', String(open));
		panel.inert = !open;
	};

	for (const option of options) {
		option.addEventListener('click', () => {
			const theme = option.dataset.themeOption;
			if (!theme || !isThemeId(theme)) return;
			applyTheme(theme);
			setOpen(false);
		}, { signal });
	}
	trigger?.addEventListener('click', () => setOpen(!switcher.classList.contains('is-open')), { signal });
	document.addEventListener('click', (event) => {
		if (switcher.classList.contains('is-open') && event.target instanceof Node && !switcher.contains(event.target)) setOpen(false);
	}, { signal });
	document.addEventListener('keydown', (event) => {
		if (event.key !== 'Escape' || !switcher.classList.contains('is-open')) return;
		setOpen(false);
		trigger?.focus({ preventScroll: true });
	}, { signal });
	document.addEventListener('portfolio:theme-change', syncOptions, { signal });
	document.addEventListener('astro:before-swap', () => {
		abortController.abort();
		delete switcher.dataset.interactionsReady;
	}, { once: true });

	syncOptions();
};

const initializeThemeSwitchers = () => {
	syncThemeColor(getTheme());
	document.querySelectorAll<HTMLElement>('[data-theme-switcher]').forEach(initializeThemeSwitcher);
};

initializeThemeSwitchers();
document.addEventListener('astro:page-load', initializeThemeSwitchers);
