// public/greeting/saludo.html runs for 2 s: its character hops at 1.68 s and has dropped out of view by 1.91 s.
// The tree is cued at 1.47 s, a couple of frames before its CSS animation runs, so it reaches the head on the hop
// and then pushes the character down (see tree-stomp).
const dropAt = 1470;

/** Plays the greeting animation in `stage`, then drops its file tree onto the character. */
export const playGreeting = (stage: HTMLElement) => {
	const frame = stage.querySelector<HTMLIFrameElement>('[data-greeting-frame]');
	const tree = stage.querySelector<HTMLElement>('.file-tree');
	if (!frame?.dataset.src || !tree || matchMedia('(prefers-reduced-motion: reduce)').matches) {
		frame?.remove();
		return;
	}

	const land = (head: Element | null | undefined) => {
		// How far above its resting place the tree meets the character's head.
		const top = frame.getBoundingClientRect().top + (head?.getBoundingClientRect().top ?? 0);
		stage.style.setProperty('--greeting-reach', `${top - tree.getBoundingClientRect().bottom}px`);
		stage.dataset.greeting = 'landing';
	};

	stage.dataset.greeting = 'playing';
	frame.addEventListener('load', async () => {
		// Timed on the animation's own clock: it starts a little after the frame loads.
		const doc = frame.contentDocument;
		const clock = doc?.getAnimations()[0];
		await clock?.ready;
		setTimeout(() => land(doc?.querySelector('.rig')), dropAt - Number(clock?.currentTime ?? 0));
	}, { once: true });
	frame.src = frame.dataset.src;

	tree.addEventListener('animationend', () => {
		frame.remove();
		delete stage.dataset.greeting;
		stage.style.removeProperty('--greeting-reach');
	}, { once: true });
};
