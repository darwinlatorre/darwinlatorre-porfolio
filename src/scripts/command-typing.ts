// Types each section's prompt command once, the first time it scrolls into view,
// so the content below reads as that command's output.
const initializeCommandTyping = () => {
	const commands = document.querySelectorAll<HTMLElement>('[data-typed-command]:not([data-typing-ready])');
	if (commands.length === 0) return;
	// Without motion (or without IntersectionObserver) the commands simply stay printed.
	if (window.matchMedia('(prefers-reduced-motion: reduce)').matches || !('IntersectionObserver' in window)) return;

	const observer = new IntersectionObserver((entries) => {
		for (const entry of entries) {
			if (!entry.isIntersecting) continue;
			const command = entry.target as HTMLElement;
			observer.unobserve(command);
			command.classList.add('is-typing');
			command.addEventListener('animationend', (event) => {
				if (event.animationName !== 'command-type') return;
				command.classList.remove('is-typing');
				command.classList.add('is-typed');
			});
		}
	}, { threshold: 1 });

	const pending = new Set(commands);
	for (const command of commands) {
		command.style.setProperty('--chars', String(command.textContent?.length ?? 0));
		command.dataset.typingReady = '';
		observer.observe(command);
	}

	// A jump (deep link, `go certificates`) can skip a command without it ever being fully in
	// view; once it is above the viewport, print it at once so its output is not left hidden.
	const scroller = document.querySelector<HTMLElement>('[data-page-scroll]');
	const abortController = new AbortController();
	let frameId = 0;
	const printSkipped = () => {
		frameId = 0;
		for (const command of pending) {
			if (command.classList.contains('is-typing') || command.classList.contains('is-typed')) {
				pending.delete(command);
			} else if (command.getBoundingClientRect().bottom < 0) {
				observer.unobserve(command);
				command.classList.add('is-typed');
				pending.delete(command);
			}
		}
		if (pending.size === 0) abortController.abort();
	};
	scroller?.addEventListener('scroll', () => {
		frameId ||= window.requestAnimationFrame(printSkipped);
	}, { passive: true, signal: abortController.signal });

	document.addEventListener('astro:before-swap', () => {
		observer.disconnect();
		abortController.abort();
		window.cancelAnimationFrame(frameId);
	}, { once: true });
};

initializeCommandTyping();
document.addEventListener('astro:page-load', initializeCommandTyping);
