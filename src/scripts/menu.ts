const initializeMenu = (menu: HTMLElement) => {
	if (menu.dataset.interactionsReady === 'true') return;
	const trigger = menu.querySelector<HTMLButtonElement>('[data-menu-trigger]');
	const panel = menu.querySelector<HTMLElement>('[data-menu-panel]');
	if (!trigger || !panel) return;

	menu.dataset.interactionsReady = 'true';
	const abortController = new AbortController();
	const { signal } = abortController;
	const setOpen = (open: boolean) => {
		menu.classList.toggle('is-open', open);
		trigger.setAttribute('aria-expanded', String(open));
		trigger.setAttribute('aria-label', open ? 'Close navigation' : 'Open navigation');
		panel.setAttribute('aria-hidden', String(!open));
		panel.inert = !open;
	};

	trigger.addEventListener('click', () => {
		setOpen(trigger.getAttribute('aria-expanded') !== 'true');
	}, { signal });
	menu.addEventListener('menu:close', () => setOpen(false), { signal });
	panel.addEventListener('click', (event) => {
		if (event.target instanceof Element && event.target.closest('a')) setOpen(false);
	}, { signal });
	document.addEventListener('click', (event) => {
		if (menu.classList.contains('is-open') && event.target instanceof Node && !menu.contains(event.target)) {
			setOpen(false);
		}
	}, { signal });
	document.addEventListener('keydown', (event) => {
		if (event.key === 'Escape' && menu.classList.contains('is-open')) {
			setOpen(false);
			trigger.focus({ preventScroll: true });
		}
	}, { signal });
	document.addEventListener('astro:before-swap', () => {
		setOpen(false);
		abortController.abort();
		delete menu.dataset.interactionsReady;
	}, { once: true });
};

const initializeMenus = () => document.querySelectorAll<HTMLElement>('[data-menu]').forEach(initializeMenu);

initializeMenus();
document.addEventListener('astro:page-load', initializeMenus);
