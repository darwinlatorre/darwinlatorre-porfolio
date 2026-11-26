const editableSelector = 'input, textarea, select, [contenteditable="true"]';
// Starting closer than this to the left edge would fight the system back gesture.
const systemEdge = 24;
const swipeDistance = 60;

// True when the touch started on something that scrolls sideways (e.g. the projects carousel).
const startsInHorizontalScroller = (target: EventTarget | null) => {
	for (let element = target instanceof Element ? target : null; element; element = element.parentElement) {
		if (element.scrollWidth > element.clientWidth + 1 && /^(auto|scroll)$/.test(getComputedStyle(element).overflowX)) {
			return true;
		}
	}
	return false;
};

const initializeDrawer = (drawer: HTMLElement) => {
	if (drawer.dataset.interactionsReady === 'true') return;
	const handle = drawer.querySelector<HTMLButtonElement>('[data-drawer-open]');
	const panel = drawer.querySelector<HTMLElement>('[data-drawer-panel]');
	const backdrop = drawer.querySelector<HTMLElement>('[data-drawer-backdrop]');
	const scroller = document.querySelector<HTMLElement>('[data-page-scroll]');
	if (!handle || !panel || !backdrop) return;

	drawer.dataset.interactionsReady = 'true';
	const abortController = new AbortController();
	const { signal } = abortController;
	const mobileViewport = window.matchMedia('(max-width: 48rem)');
	const links = panel.querySelectorAll<HTMLAnchorElement>('[data-drawer-link]');
	let swipe: { x: number; y: number; closing: boolean } | null = null;

	const isOpen = () => drawer.classList.contains('is-open');
	const markCurrentSection = () => {
		const current = document.querySelector<HTMLElement>('[data-terminal-root]')?.dataset.terminalContext;
		for (const link of links) {
			if (link.dataset.drawerLink === current) link.setAttribute('aria-current', 'true');
			else link.removeAttribute('aria-current');
		}
	};
	const setOpen = (open: boolean, { restoreFocus = true } = {}) => {
		if (open === isOpen()) return;
		if (open) markCurrentSection();
		drawer.classList.toggle('is-open', open);
		handle.setAttribute('aria-expanded', String(open));
		panel.setAttribute('aria-hidden', String(!open));
		panel.inert = !open;
		// The page behind stays visible but cannot be reached while the drawer is open.
		if (scroller) scroller.inert = open;
		if (open) panel.querySelector<HTMLElement>('a')?.focus({ preventScroll: true });
		else if (restoreFocus && panel.contains(document.activeElement)) handle.focus({ preventScroll: true });
	};

	// iOS keeps the layout viewport when the keyboard opens; track the visible area instead
	// so the drawer (and the terminal at its bottom) always sits above the keyboard.
	const viewport = window.visualViewport;
	const syncViewport = () => {
		if (!viewport) return;
		drawer.style.setProperty('--drawer-viewport-height', `${viewport.height}px`);
		drawer.style.setProperty('--drawer-viewport-top', `${viewport.offsetTop}px`);
	};
	viewport?.addEventListener('resize', syncViewport, { signal });
	viewport?.addEventListener('scroll', syncViewport, { signal });
	syncViewport();

	handle.addEventListener('click', () => setOpen(true), { signal });
	backdrop.addEventListener('click', () => setOpen(false), { signal });
	panel.addEventListener('click', (event) => {
		if (event.target instanceof Element && event.target.closest('a[href^="#"]')) setOpen(false, { restoreFocus: false });
	}, { signal });
	// Terminal commands such as `go about` navigate away; close so the target is visible.
	document.addEventListener('portfolio:navigate', () => setOpen(false, { restoreFocus: false }), { signal });
	document.addEventListener('keydown', (event) => {
		if (event.key === 'Escape' && isOpen()) setOpen(false);
	}, { signal });
	mobileViewport.addEventListener('change', () => {
		if (!mobileViewport.matches) setOpen(false, { restoreFocus: false });
	}, { signal });

	document.addEventListener('touchstart', (event) => {
		swipe = null;
		if (!mobileViewport.matches || event.touches.length !== 1 || document.querySelector('dialog[open]')) return;
		const touch = event.touches[0];
		const target = event.target;
		if (target instanceof Element && target.closest(editableSelector)) return;
		if (isOpen()) {
			swipe = { x: touch.clientX, y: touch.clientY, closing: true };
			return;
		}
		if (touch.clientX < systemEdge || startsInHorizontalScroller(target)) return;
		swipe = { x: touch.clientX, y: touch.clientY, closing: false };
	}, { passive: true, signal });

	document.addEventListener('touchend', (event) => {
		const start = swipe;
		swipe = null;
		const touch = event.changedTouches[0];
		if (!start || !touch) return;
		const deltaX = touch.clientX - start.x;
		const deltaY = touch.clientY - start.y;
		// Only a clearly horizontal swipe counts, so vertical scrolling never opens the drawer.
		if (Math.abs(deltaX) < swipeDistance || Math.abs(deltaX) < Math.abs(deltaY) * 1.5) return;
		if (!start.closing && deltaX > 0) setOpen(true);
		if (start.closing && deltaX < 0) setOpen(false);
	}, { passive: true, signal });
	document.addEventListener('touchcancel', () => { swipe = null; }, { passive: true, signal });

	document.addEventListener('astro:before-swap', () => {
		setOpen(false, { restoreFocus: false });
		abortController.abort();
		delete drawer.dataset.interactionsReady;
	}, { once: true });
};

const initializeDrawers = () => document.querySelectorAll<HTMLElement>('[data-drawer]').forEach(initializeDrawer);

initializeDrawers();
document.addEventListener('astro:page-load', initializeDrawers);
