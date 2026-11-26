// Marks which edge of the desktop project row still hides cards, so CSS can fade it.
const initializeProjectCarousel = () => {
	const carousel = document.querySelector<HTMLElement>('[data-project-carousel]');
	if (!carousel || carousel.dataset.overflowReady === 'true') return;
	carousel.dataset.overflowReady = 'true';
	const abortController = new AbortController();
	const update = () => {
		const max = carousel.scrollWidth - carousel.clientWidth;
		const position = carousel.scrollLeft;
		carousel.dataset.overflow = max <= 1 ? 'none' : position <= 1 ? 'start' : position >= max - 1 ? 'end' : 'middle';
	};
	carousel.addEventListener('scroll', update, { passive: true, signal: abortController.signal });
	const resizeObserver = typeof ResizeObserver !== 'undefined' ? new ResizeObserver(update) : null;
	resizeObserver?.observe(carousel);
	document.addEventListener('astro:before-swap', () => {
		abortController.abort();
		resizeObserver?.disconnect();
		delete carousel.dataset.overflowReady;
	}, { once: true });
	update();
};

initializeProjectCarousel();
document.addEventListener('astro:page-load', initializeProjectCarousel);
