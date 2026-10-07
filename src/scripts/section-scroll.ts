interface SectionScrollOptions {
	scroller: HTMLElement;
	mobileViewport: MediaQueryList;
	signal: AbortSignal;
	onNavigate: () => void;
}

interface TouchGesture {
	identifier: number;
	section: HTMLElement;
	panes: HTMLElement[];
	startX: number;
	startY: number;
	lastY: number;
	lastTime: number;
	velocity: number;
	axis: 'horizontal' | 'vertical' | null;
	transitioned: boolean;
	canAdvance: boolean;
	canGoBack: boolean;
}

interface PaneScrollOptions {
	keyboard?: boolean;
	allowTransition?: boolean;
}

const sectionSelector = '.screen, #site-footer';
const editableSelector = 'input, textarea, select, [contenteditable="true"]';

export const initializeSectionScroll = ({
	scroller, mobileViewport, signal, onNavigate,
}: SectionScrollOptions) => {
	const sections = Array.from(scroller.querySelectorAll<HTMLElement>(sectionSelector));
	const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
	let activeSection = sections[0];
	let gesture: TouchGesture | null = null;
	let momentumFrame = 0;
	let wheelLocked = false;
	let lastWheelTime = 0;
	let navigationPending = false;
	let pendingFocus: HTMLElement | null = null;

	const stopMomentum = () => {
		window.cancelAnimationFrame(momentumFrame);
		momentumFrame = 0;
	};
	const sectionTop = (section: HTMLElement) => Math.max(0, Math.min(
		scroller.scrollHeight - scroller.clientHeight,
		section.getBoundingClientRect().top - scroller.getBoundingClientRect().top + scroller.scrollTop,
	));
	const getActiveSection = () => {
		if (navigationPending) return activeSection;
		if (Math.abs(sectionTop(activeSection) - scroller.scrollTop) > 2) {
			activeSection = sections.reduce((closest, section) =>
				Math.abs(sectionTop(section) - scroller.scrollTop) < Math.abs(sectionTop(closest) - scroller.scrollTop)
					? section : closest,
			);
		}
		return activeSection;
	};
	const mainPane = (section: HTMLElement) => section.querySelector<HTMLElement>(
		section.hasAttribute('data-home-details') ? '[data-tree-scroll]' : '[data-terminal-scroll], [data-projects-content]',
	);
	const getPanes = (section: HTMLElement, target?: Element) => {
		const panes: HTMLElement[] = [];
		if (target && section.contains(target)) {
			for (let element: Element | null = target; element && element !== section; element = element.parentElement) {
				if (element instanceof HTMLElement && element.scrollHeight > element.clientHeight + 2 && /^(auto|scroll)$/.test(getComputedStyle(element).overflowY)) panes.push(element);
			}
		}
		const pane = mainPane(section);
		if (pane && !panes.includes(pane)) panes.push(pane);
		return panes;
	};
	const remaining = (pane: HTMLElement, direction: number) => direction > 0
		? Math.max(0, pane.scrollHeight - pane.clientHeight - pane.scrollTop)
		: Math.max(0, pane.scrollTop);
	const activate = (section: HTMLElement, direction: number, keyboard = false) => {
		const focused = document.activeElement;
		if (section !== activeSection && focused instanceof HTMLElement && activeSection.contains(focused)) focused.blur();
		activeSection = section;
		const pane = mainPane(section);
		if (pane) pane.scrollTop = direction > 0 ? 0 : pane.scrollHeight;
		const top = sectionTop(section);
		navigationPending = !reducedMotion.matches && Math.abs(top - scroller.scrollTop) > 2;
		pendingFocus = keyboard && pane?.hasAttribute('tabindex') ? pane : null;
		scroller.scrollTo({ top, behavior: reducedMotion.matches ? 'instant' : 'smooth' });
		scroller.dataset.activeSection = section.id || 'home';
		onNavigate();
		if (!navigationPending) {
			pendingFocus?.focus({ preventScroll: true });
			pendingFocus = null;
		}
	};
	const navigate = (section: HTMLElement, direction: number, keyboard = false) => {
		const next = sections[sections.indexOf(section) + direction];
		if (!next) return false;
		activate(next, direction, keyboard);
		return true;
	};
	const scrollPane = (section: HTMLElement, panes: HTMLElement[], amount: number, {
		keyboard = false, allowTransition = true,
	}: PaneScrollOptions = {}) => {
		if (navigationPending) return false;
		const direction = Math.sign(amount);
		if (!direction) return false;
		let delta = Math.abs(amount);
		for (const pane of panes) {
			const consumed = Math.min(delta, remaining(pane, direction));
			pane.scrollTop += consumed * direction;
			delta -= consumed;
			if (remaining(pane, direction) > 2) return false;
		}
		return allowTransition && navigate(section, direction, keyboard);
	};

	scroller.dataset.sectionScrollReady = 'true';
	scroller.addEventListener('scroll', () => {
		if (!navigationPending || Math.abs(sectionTop(activeSection) - scroller.scrollTop) > 2) return;
		navigationPending = false;
		onNavigate();
		pendingFocus?.focus({ preventScroll: true });
		pendingFocus = null;
	}, { passive: true, signal });
	scroller.addEventListener('touchstart', (event) => {
		stopMomentum();
		gesture = null;
		if (navigationPending || !mobileViewport.matches || event.touches.length !== 1 || !(event.target instanceof Element)) return;
		if (event.target.closest(editableSelector)) return;
		const touch = event.touches[0];
		const section = getActiveSection();
		const panes = getPanes(section, event.target);
		gesture = {
			identifier: touch.identifier, section, panes,
			startX: touch.clientX, startY: touch.clientY, lastY: touch.clientY,
			lastTime: performance.now(), velocity: 0, axis: null, transitioned: false,
			// Only a gesture that starts at the edge can leave the current section.
			canAdvance: panes.every((pane) => remaining(pane, 1) <= 2),
			canGoBack: panes.every((pane) => remaining(pane, -1) <= 2),
		};
	}, { passive: true, signal });
	scroller.addEventListener('touchmove', (event) => {
		if (!gesture) return;
		if (event.touches.length !== 1) { gesture = null; return; }
		const touch = Array.from(event.touches).find(({ identifier }) => identifier === gesture?.identifier);
		if (!touch) return;
		const deltaX = touch.clientX - gesture.startX;
		const deltaY = gesture.startY - touch.clientY;
		if (!gesture.axis) {
			if (Math.max(Math.abs(deltaX), Math.abs(deltaY)) < 10) return;
			gesture.axis = Math.abs(deltaX) > Math.abs(deltaY) ? 'horizontal' : 'vertical';
		}
		if (gesture.axis === 'horizontal') return;
		event.preventDefault();
		if (gesture.transitioned) return;
		const now = performance.now();
		const amount = gesture.lastY - touch.clientY;
		gesture.velocity = amount / Math.max(now - gesture.lastTime, 1);
		gesture.lastY = touch.clientY;
		gesture.lastTime = now;
		gesture.transitioned = scrollPane(gesture.section, gesture.panes, amount, {
			allowTransition: amount > 0 ? gesture.canAdvance : gesture.canGoBack,
		});
	}, { passive: false, signal });
	scroller.addEventListener('touchend', () => {
		const completed = gesture;
		gesture = null;
		if (!completed || completed.axis !== 'vertical' || completed.transitioned || reducedMotion.matches || performance.now() - completed.lastTime > 80) return;
		let velocity = Math.max(-2.5, Math.min(2.5, completed.velocity));
		let lastTime = performance.now();
		const glide = (now: number) => {
			const elapsed = Math.min(now - lastTime, 32);
			lastTime = now;
			velocity *= Math.pow(0.92, elapsed / 16);
			if (Math.abs(velocity) < 0.08 || activeSection !== completed.section || completed.panes.every((pane) => remaining(pane, Math.sign(velocity)) <= 2)) {
				momentumFrame = 0;
				return;
			}
			// Inertia may finish the pane, but changing sections needs a fresh swipe.
			scrollPane(completed.section, completed.panes, velocity * elapsed, { allowTransition: false });
			momentumFrame = window.requestAnimationFrame(glide);
		};
		momentumFrame = window.requestAnimationFrame(glide);
	}, { passive: true, signal });
	const cancelGesture = () => { gesture = null; stopMomentum(); };
	scroller.addEventListener('touchcancel', cancelGesture, { passive: true, signal });
	scroller.addEventListener('focusin', cancelGesture, { signal });
	mobileViewport.addEventListener('change', cancelGesture, { signal });

	document.addEventListener('wheel', (event) => {
		if (document.querySelector('dialog[open]') || event.ctrlKey || Math.abs(event.deltaY) <= Math.abs(event.deltaX)) return;
		if (event.target instanceof Element && event.target.closest('[data-menu-panel]')) return;
		event.preventDefault();
		stopMomentum();
		const now = performance.now();
		if (now - lastWheelTime > 180) wheelLocked = false;
		lastWheelTime = now;
		if (wheelLocked) return;
		const section = getActiveSection();
		const delta = event.deltaMode === WheelEvent.DOM_DELTA_LINE ? event.deltaY * 16
			: event.deltaMode === WheelEvent.DOM_DELTA_PAGE ? event.deltaY * scroller.clientHeight : event.deltaY;
		wheelLocked = scrollPane(section, getPanes(section, event.target instanceof Element ? event.target : undefined), delta);
	}, { passive: false, signal });

	document.addEventListener('keydown', (event) => {
		if (document.querySelector('dialog[open]') || event.altKey || event.ctrlKey || event.metaKey) return;
		if (event.target instanceof Element) {
			if (event.target.closest(editableSelector) || event.target.closest('[data-menu-panel]')) return;
			if (event.key === ' ' && event.target.closest('button, summary')) return;
		}
		const section = getActiveSection();
		const pane = mainPane(section);
		const height = pane?.clientHeight || scroller.clientHeight;
		const amounts: Record<string, number> = { ArrowDown: 48, ArrowUp: -48, PageDown: height * 0.8, PageUp: -height * 0.8 };
		const amount = event.key === ' ' ? height * (event.shiftKey ? -0.8 : 0.8) : amounts[event.key];
		if (!amount) return;
		event.preventDefault();
		stopMomentum();
		scrollPane(section, getPanes(section, event.target instanceof Element ? event.target : undefined), amount, { keyboard: true });
	}, { signal });

	signal.addEventListener('abort', () => {
		cancelGesture();
		delete scroller.dataset.sectionScrollReady;
		delete scroller.dataset.activeSection;
	}, { once: true });

	return {
		navigateTo: (target: HTMLElement) => {
			cancelGesture();
			wheelLocked = false;
			const section = target.closest<HTMLElement>(sectionSelector) || target.querySelector<HTMLElement>('.screen');
			if (!section) return;
			activate(section, 1);
			if (target !== section) target.scrollIntoView({ behavior: reducedMotion.matches ? 'instant' : 'smooth', block: 'nearest', inline: 'center' });
		},
		scrollBy: (amount: number) => {
			cancelGesture();
			const section = getActiveSection();
			scrollPane(section, getPanes(section), amount);
		},
	};
};
