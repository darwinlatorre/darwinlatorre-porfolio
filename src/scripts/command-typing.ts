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

	for (const command of commands) {
		command.style.setProperty('--chars', String(command.textContent?.length ?? 0));
		command.dataset.typingReady = '';
		observer.observe(command);
	}

	document.addEventListener('astro:before-swap', () => observer.disconnect(), { once: true });
};

initializeCommandTyping();
document.addEventListener('astro:page-load', initializeCommandTyping);
