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
}

export const initializeSectionScroll = ({
	scroller, mobileViewport, signal, onNavigate,
}: SectionScrollOptions) => {
	const sections = Array.from(scroller.querySelectorAll<HTMLElement>('.screen, #site-footer'));
	const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
	let activeSection = sections[0];
	let gesture: TouchGesture | null = null;
	let momentumFrame = 0;
	let wheelLocked = false;
	let lastWheelTime = 0;

	const stopMomentum = () => {
		window.cancelAnimationFrame(momentumFrame);
		momentumFrame = 0;
	};
	const sectionTop = (section: HTMLElement) => Math.max(0, Math.min(
		scroller.scrollHeight - scroller.clientHeight,
		section.getBoundingClientRect().top - scroller.getBoundingClientRect().top + scroller.scrollTop,
	));
	const getActiveSection = () => {
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
			for (let element = target.closest<HTMLElement>('*'); element && element !== section; element = element.parentElement) {
				if (element.scrollHeight > element.clientHeight + 2 && /^(auto|scroll)$/.test(getComputedStyle(element).overflowY)) panes.push(element);
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
		activeSection = section;
		const pane = mainPane(section);
		if (pane) pane.scrollTop = direction > 0 ? 0 : pane.scrollHeight;
		scroller.scrollTo({ top: sectionTop(section), behavior: 'instant' });
		scroller.dataset.activeSection = section.id || 'home';
		onNavigate();
		if (keyboard && pane?.hasAttribute('tabindex')) pane.focus({ preventScroll: true });
	};
	const navigate = (section: HTMLElement, direction: number, keyboard = false) => {
		const next = sections[sections.indexOf(section) + direction];
		if (!next) return false;
		activate(next, direction, keyboard);
		return true;
	};
	const scrollPane = (section: HTMLElement, panes: HTMLElement[], amount: number, keyboard = false) => {
		const direction = Math.sign(amount);
		if (!direction) return false;
		let delta = Math.abs(amount);
		for (const pane of panes) {
			const consumed = Math.min(delta, remaining(pane, direction));
			pane.scrollTop += consumed * direction;
			delta -= consumed;
			if (remaining(pane, direction) > 2) return false;
		}
		// Reaching the edge is enough: no additional swipe, timeout or animation.
		return navigate(section, direction, keyboard);
	};

	scroller.dataset.sectionScrollReady = 'true';
	scroller.addEventListener('touchstart', (event) => {
		stopMomentum();
		gesture = null;
		if (!mobileViewport.matches || event.touches.length !== 1 || !(event.target instanceof Element)) return;
		if (event.target.closest('input, textarea, select, [contenteditable="true"]')) return;
		const touch = event.touches[0];
		const section = getActiveSection();
		gesture = {
			identifier: touch.identifier, section, panes: getPanes(section, event.target),
			startX: touch.clientX, startY: touch.clientY, lastY: touch.clientY,
			lastTime: performance.now(), velocity: 0, axis: null, transitioned: false,
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
		gesture.transitioned = scrollPane(gesture.section, gesture.panes, amount);
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
			if (Math.abs(velocity) < 0.08 || activeSection !== completed.section || scrollPane(completed.section, completed.panes, velocity * elapsed)) {
				momentumFrame = 0;
				return;
			}
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
			if (event.target.closest('input, textarea, select, [contenteditable="true"]')) return;
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
		scrollPane(section, getPanes(section, event.target instanceof Element ? event.target : undefined), amount, true);
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
			const section = target.closest<HTMLElement>('.screen, #site-footer') || target.querySelector<HTMLElement>('.screen');
			if (!section) return;
			activate(section, 1);
			if (target !== section) target.scrollIntoView({ behavior: 'instant', block: 'nearest', inline: 'center' });
		},
		scrollBy: (amount: number) => {
			cancelGesture();
			const section = getActiveSection();
			scrollPane(section, getPanes(section), amount);
		},
	};
};
