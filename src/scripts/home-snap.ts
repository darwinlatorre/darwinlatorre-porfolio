interface HomeSnapOptions {
	scroller: HTMLElement;
	details: HTMLElement;
	about?: HTMLElement | null;
	treeScroll?: HTMLElement | null;
	signal: AbortSignal;
}

export interface HomeSnap {
	scrollTo: (top: number) => void;
	detailsTop: () => number;
}

const editableSelector = 'input, textarea, select, [contenteditable="true"]';
const keyDirections: Record<string, number> = { ArrowDown: 1, PageDown: 1, ArrowUp: -1, PageUp: -1 };
const wheelIdleGap = 180;
const settleDelay = 140;
const snapTimeout = 1000;

/**
 * Snaps between #home, #home-details and the top of #about; below #about the page scrolls natively.
 */
export const initializeHomeSnap = ({ scroller, details, about, treeScroll, signal }: HomeSnapOptions): HomeSnap => {
	const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
	let pendingTop: number | null = null;
	let pendingTimer = 0;
	let settleTimer = 0;
	let lastScrollTop = scroller.scrollTop;
	let lastDirection = 1;
	let lastWheelTime = 0;
	let wheelLocked = false;
	let touching = false;
	let touch: { x: number; y: number; handled: boolean } | null = null;

	const offsetTop = (element: HTMLElement) =>
		element.getBoundingClientRect().top - scroller.getBoundingClientRect().top + scroller.scrollTop;
	const detailsTop = () => offsetTop(details);
	// Without #about the last snap point is #home-details itself.
	const aboutTop = () => (about ? offsetTop(about) : detailsTop());
	const near = (top: number, point: number) => Math.abs(top - point) <= 1;
	const inSnapZone = () => {
		const top = scroller.scrollTop;
		return top > 1 && top < aboutTop() - 1 && !near(top, detailsTop());
	};
	const treeCanScroll = (direction: number, element: EventTarget | null) => {
		if (!treeScroll || !(element instanceof Node) || !treeScroll.contains(element)) return false;
		return direction > 0
			? treeScroll.scrollTop + treeScroll.clientHeight < treeScroll.scrollHeight - 1
			: treeScroll.scrollTop > 1;
	};
	// Returns where a scroll intent should snap, or null when native scrolling applies.
	const snapDestination = (direction: number, element: EventTarget | null) => {
		const top = scroller.scrollTop;
		const middle = detailsTop();
		const end = aboutTop();
		if (top < middle - 1) return direction > 0 ? middle : 0;
		if (near(top, middle)) {
			// The mobile tree pane scrolls on its own before the page moves on.
			if (treeCanScroll(direction, element)) return null;
			if (direction < 0) return 0;
			return end > middle + 1 ? end : null;
		}
		if (top < end - 1) return direction > 0 ? end : middle;
		if (near(top, end) && direction < 0) return middle;
		return null;
	};
	const clearPending = () => {
		pendingTop = null;
		window.clearTimeout(pendingTimer);
	};
	const scrollTo = (requestedTop: number) => {
		const top = Math.max(0, Math.min(requestedTop, scroller.scrollHeight - scroller.clientHeight));
		window.clearTimeout(settleTimer);
		clearPending();
		if (Math.abs(scroller.scrollTop - top) > 1) {
			pendingTop = top;
			// Interrupted smooth scrolls never reach their target; release the lock anyway.
			pendingTimer = window.setTimeout(clearPending, snapTimeout);
		}
		scroller.scrollTo({ top, behavior: reducedMotion.matches ? 'instant' : 'smooth' });
	};
	// Returns true when the intent was consumed by a snap.
	const handleIntent = (event: Event, direction: number) => {
		if (pendingTop !== null) {
			event.preventDefault();
			return true;
		}
		const top = snapDestination(direction, event.target);
		if (top === null) return false;
		event.preventDefault();
		scrollTo(top);
		return true;
	};
	const isBlocked = (target: EventTarget | null) =>
		Boolean(document.querySelector('dialog[open]')) ||
		(target instanceof Element && Boolean(target.closest('[data-menu-panel], [data-terminal-root], [data-drawer-panel]')));
	const scheduleSettle = () => {
		window.clearTimeout(settleTimer);
		settleTimer = window.setTimeout(() => {
			// Scrollbar drags, momentum and native keys may stop between both views.
			if (touching || pendingTop !== null || !inSnapZone()) return;
			const middle = detailsTop();
			if (scroller.scrollTop < middle) scrollTo(lastDirection > 0 ? middle : 0);
			else scrollTo(lastDirection > 0 ? aboutTop() : middle);
		}, settleDelay);
	};

	scroller.addEventListener('scroll', () => {
		const top = scroller.scrollTop;
		if (top !== lastScrollTop) lastDirection = Math.sign(top - lastScrollTop);
		lastScrollTop = top;
		if (pendingTop !== null) {
			if (Math.abs(top - pendingTop) <= 1) clearPending();
			return;
		}
		scheduleSettle();
	}, { passive: true, signal });

	document.addEventListener('wheel', (event) => {
		if (event.ctrlKey || Math.abs(event.deltaY) <= Math.abs(event.deltaX) || isBlocked(event.target)) return;
		const now = performance.now();
		if (now - lastWheelTime > wheelIdleGap) wheelLocked = false;
		lastWheelTime = now;
		// Trackpad inertia after a snap must not carry the page past the snap point.
		if (wheelLocked) {
			event.preventDefault();
			return;
		}
		wheelLocked = handleIntent(event, Math.sign(event.deltaY));
	}, { passive: false, signal });

	document.addEventListener('keydown', (event) => {
		if (event.altKey || event.ctrlKey || event.metaKey || isBlocked(event.target)) return;
		if (event.target instanceof Element) {
			if (event.target.closest(editableSelector)) return;
			if (event.key === ' ' && event.target.closest('button, summary, a')) return;
		}
		const direction = event.key === ' ' ? (event.shiftKey ? -1 : 1) : keyDirections[event.key];
		if (direction) handleIntent(event, direction);
	}, { signal });

	scroller.addEventListener('touchstart', (event) => {
		touching = true;
		touch = null;
		if (event.touches.length !== 1 || isBlocked(event.target)) return;
		if (event.target instanceof Element && event.target.closest(editableSelector)) return;
		touch = { x: event.touches[0].clientX, y: event.touches[0].clientY, handled: false };
	}, { passive: true, signal });

	scroller.addEventListener('touchmove', (event) => {
		if (!touch) return;
		if (touch.handled) {
			event.preventDefault();
			return;
		}
		const deltaX = event.touches[0].clientX - touch.x;
		const deltaY = touch.y - event.touches[0].clientY;
		if (Math.max(Math.abs(deltaX), Math.abs(deltaY)) < 8) return;
		// Horizontal swipes belong to carousels and the mobile drawer.
		if (Math.abs(deltaX) > Math.abs(deltaY)) {
			touch = null;
			return;
		}
		if (handleIntent(event, Math.sign(deltaY))) touch.handled = true;
		else touch = null;
	}, { passive: false, signal });

	const endTouch = () => {
		touching = false;
		touch = null;
		scheduleSettle();
	};
	scroller.addEventListener('touchend', endTouch, { passive: true, signal });
	scroller.addEventListener('touchcancel', endTouch, { passive: true, signal });

	signal.addEventListener('abort', () => {
		clearPending();
		window.clearTimeout(settleTimer);
	}, { once: true });

	return { scrollTo, detailsTop };
};
