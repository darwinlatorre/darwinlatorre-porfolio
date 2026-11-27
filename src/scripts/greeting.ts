// public/greeting/saludo.html runs for 2 s and its character drops out of view from 1.7 s:
// the tree starts falling just before, so it hits as the character goes down.
const dropAt = 1500;

/** Plays the greeting animation in `stage`, then drops its file tree onto the character. */
export const playGreeting = (stage: HTMLElement) => {
	const frame = stage.querySelector<HTMLIFrameElement>('[data-greeting-frame]');
	const tree = stage.querySelector<HTMLElement>('.file-tree');
	if (!frame?.dataset.src || !tree || matchMedia('(prefers-reduced-motion: reduce)').matches) {
		frame?.remove();
		return;
	}

	stage.dataset.greeting = 'playing';
	frame.addEventListener('load', () => {
		setTimeout(() => (stage.dataset.greeting = 'landing'), dropAt);
	}, { once: true });
	frame.src = frame.dataset.src;

	tree.addEventListener('animationend', () => {
		frame.remove();
		delete stage.dataset.greeting;
	}, { once: true });
};
