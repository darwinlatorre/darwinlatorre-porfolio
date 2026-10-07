interface SectionScrollOptions {
	scroller: HTMLElement;
	mobileViewport: MediaQueryList;
	reducedMotion: MediaQueryList;
	signal: AbortSignal;
	beforeNavigate: () => void;
}

interface TouchGesture {
	identifier: number;
	section: HTMLElement;
	panes: HTMLElement[];
	startX: number;
	startY: number;
	x: number;
	y: number;
	downBudget: number;
	upBudget: number;
}

// Keep native scrolling inside panes and hand off only deliberate edge gestures.
export const initializeSectionScroll = ({
	scroller, mobileViewport, reducedMotion, signal, beforeNavigate,
}: SectionScrollOptions) => {
	const sections = Array.from(scroller.querySelectorAll<HTMLElement>('.screen, #site-footer'));
	let gesture: TouchGesture | null = null;
	let wheelSection: HTMLElement | null = null;
	let wheelAmount = 0;
	let lastWheelTime = 0;
	let navigationUntil = 0;
	let pendingTouch: { section: HTMLElement; direction: number } | null = null;
	let settleTimer = 0;
	const cancelTouch = () => {
		gesture = null;
		pendingTouch = null;
		window.clearTimeout(settleTimer);
	};

	const getSection = (target: EventTarget | null) =>
		target instanceof Element ? target.closest<HTMLElement>('.screen, #site-footer') : null;
	const getPanes = (section: HTMLElement, target: Element) => {
		const panes: HTMLElement[] = [];
		for (let element = target.closest<HTMLElement>('*'); element && element !== section; element = element.parentElement) {
			if (element.scrollHeight > element.clientHeight + 2 && /^(auto|scroll)$/.test(getComputedStyle(element).overflowY)) {
				panes.push(element);
			}
		}
		const mainPane = section.querySelector<HTMLElement>(
			'[data-terminal-scroll], [data-projects-content], [data-home-details-content]',
		);
		if (mainPane && !panes.includes(mainPane) && mainPane.scrollHeight > mainPane.clientHeight + 2) panes.push(mainPane);
		return panes;
	};
	const remaining = (pane: HTMLElement, direction: number) => direction > 0
		? Math.max(0, pane.scrollHeight - pane.clientHeight - pane.scrollTop)
		: Math.max(0, pane.scrollTop);
	const atEdge = (panes: HTMLElement[], direction: number) =>
		panes.every((pane) => remaining(pane, direction) <= 2);
	const navigate = (section: HTMLElement, direction: number) => {
		const now = performance.now();
		if (now < navigationUntil) return;
		const target = sections[sections.indexOf(section) + direction];
		if (!target) return;
		const sectionTop = section.getBoundingClientRect().top - scroller.getBoundingClientRect().top;
		// The browser may already have carried this gesture to the adjacent snap.
		if (direction * -sectionTop > scroller.clientHeight * 0.5) return;
		navigationUntil = now + 750;
		beforeNavigate();
		const pane = target.querySelector<HTMLElement>('[data-terminal-scroll], [data-projects-content]');
		if (pane) pane.scrollTop = direction > 0 ? 0 : pane.scrollHeight;
		target.scrollIntoView({
			block: target.id === 'site-footer' ? 'end' : 'start',
			behavior: reducedMotion.matches ? 'auto' : 'smooth',
		});
	};
	const settleTouch = () => {
		window.clearTimeout(settleTimer);
		if (!pendingTouch) return;
		// Let native momentum/snap settle before transferring the gesture. This also
		// prevents an instant reduced-motion jump from receiving the old momentum.
		settleTimer = window.setTimeout(() => {
			const transition = pendingTouch;
			pendingTouch = null;
			if (transition) navigate(transition.section, transition.direction);
		}, 140);
	};

	scroller.addEventListener('touchstart', (event) => {
		cancelTouch();
		if (!mobileViewport.matches || event.touches.length !== 1 || !(event.target instanceof Element)) return;
		if (event.target.closest('input, textarea, select, [contenteditable="true"]')) return;
		const section = getSection(event.target);
		if (!section) return;
		const touch = event.touches[0];
		const panes = getPanes(section, event.target);
		gesture = {
			identifier: touch.identifier, section, panes,
			startX: touch.clientX, startY: touch.clientY, x: touch.clientX, y: touch.clientY,
			downBudget: panes.reduce((total, pane) => total + remaining(pane, 1), 0),
			upBudget: panes.reduce((total, pane) => total + remaining(pane, -1), 0),
		};
	}, { passive: true, signal });
	scroller.addEventListener('touchmove', (event) => {
		if (!gesture) return;
		if (event.touches.length !== 1) { gesture = null; return; }
		const touch = Array.from(event.touches).find(({ identifier }) => identifier === gesture?.identifier);
		if (!touch) return;
		gesture.x = touch.clientX;
		gesture.y = touch.clientY;
	}, { passive: true, signal });
	scroller.addEventListener('touchend', () => {
		const completed = gesture;
		gesture = null;
		if (!completed) return;
		const deltaY = completed.startY - completed.y;
		const deltaX = completed.startX - completed.x;
		// Horizontal carousel swipes and taps must never change vertical sections.
		if (Math.abs(deltaY) <= Math.abs(deltaX) * 1.25) return;
		const direction = deltaY > 0 ? 1 : -1;
		const budget = direction > 0 ? completed.downBudget : completed.upBudget;
		if (Math.abs(deltaY) - budget < 48 || !atEdge(completed.panes, direction)) return;
		pendingTouch = { section: completed.section, direction };
		settleTouch();
	}, { passive: true, signal });
	scroller.addEventListener('scroll', settleTouch, { capture: true, passive: true, signal });
	scroller.addEventListener('touchcancel', cancelTouch, { passive: true, signal });
	scroller.addEventListener('focusin', cancelTouch, { signal });
	mobileViewport.addEventListener('change', cancelTouch, { signal });
	signal.addEventListener('abort', cancelTouch, { once: true });

	scroller.addEventListener('wheel', (event) => {
		if (event.ctrlKey || Math.abs(event.deltaY) <= Math.abs(event.deltaX) || !(event.target instanceof Element)) return;
		const section = getSection(event.target);
		if (!section) return;
		const now = performance.now();
		if (now < navigationUntil) { event.preventDefault(); return; }
		const direction = event.deltaY > 0 ? 1 : -1;
		const panes = getPanes(section, event.target);
		if (!atEdge(panes, direction)) { wheelAmount = 0; return; }
		if (section !== wheelSection || now - lastWheelTime > 250 || Math.sign(wheelAmount) !== direction) wheelAmount = 0;
		wheelSection = section;
		lastWheelTime = now;
		const delta = event.deltaMode === WheelEvent.DOM_DELTA_LINE ? event.deltaY * 16
			: event.deltaMode === WheelEvent.DOM_DELTA_PAGE ? event.deltaY * scroller.clientHeight : event.deltaY;
		wheelAmount += delta;
		if (Math.abs(wheelAmount) < 80) return;
		event.preventDefault();
		wheelAmount = 0;
		navigate(section, direction);
	}, { passive: false, signal });
};
