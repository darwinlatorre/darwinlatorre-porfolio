const initializeAboutInteractions = () => {
	const root = document.querySelector<HTMLElement>('[data-about]');
	if (!root || root.dataset.interactionsReady === 'true') return;

	root.dataset.interactionsReady = 'true';

	const form = root.querySelector<HTMLFormElement>('[data-terminal-form]');
	const input = form?.querySelector<HTMLInputElement>('[data-terminal-input]');
	const mirror = form?.querySelector<HTMLElement>('[data-terminal-mirror]');
	const response = root.querySelector<HTMLElement>('[data-terminal-response]');
	const scrollContainer = root.querySelector<HTMLElement>('[data-about-content]');
	const technologyDialog = root.querySelector<HTMLDialogElement>('[data-technologies-dialog]');
	const technologyTrigger = root.querySelector<HTMLButtonElement>('[data-technologies-open]');
	const technologyClose = technologyDialog?.querySelector<HTMLButtonElement>(
		'[data-technologies-close]',
	);
	const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
	const abortController = new AbortController();

	let focusTimer = 0;
	let previousFocus: HTMLElement | null = null;

	const responses: Record<string, string> = {
		'show about':
			'DevOps and Backend Engineer focused on reliable cloud infrastructure and scalable applications.',
		'show stats': 'experience_years: 3+ | technologies_used: 16+',
		'show links': 'LinkedIn | GitHub | X',
		help: 'show | show [about|stats|links|technologies] | clear',
	};
	const syncCursor = () => {
		if (input && mirror) mirror.textContent = input.value;
	};
	const openTechnologies = () => {
		if (!technologyDialog || technologyDialog.open) return;
		previousFocus = document.activeElement instanceof HTMLElement ? document.activeElement : null;
		technologyDialog.showModal();
	};
	const closeTechnologies = () => technologyDialog?.close();

	form?.addEventListener(
		'submit',
		(event) => {
			event.preventDefault();
			if (!input || !response) return;

			const command = input.value.trim().toLowerCase();
			input.value = '';
			syncCursor();

			if (!command) return;
			if (command === 'show' || command === 'show technologies') {
				response.textContent = '';
				response.hidden = true;
				openTechnologies();
				return;
			}
			if (command === 'clear') {
				response.textContent = '';
				response.hidden = true;
				return;
			}

			response.textContent = responses[command] ?? `command not found: ${command}`;
			response.hidden = false;
		},
		{ signal: abortController.signal },
	);

	input?.addEventListener(
		'keydown',
		(event) => {
			if (event.key === 'Escape') {
				input.value = '';
				syncCursor();
			}
		},
		{ signal: abortController.signal },
	);
	input?.addEventListener('input', syncCursor, { signal: abortController.signal });
	input?.addEventListener(
		'focus',
		() => {
			window.clearTimeout(focusTimer);
			focusTimer = window.setTimeout(() => {
				if (!scrollContainer) return;

				const inputTop =
					input.getBoundingClientRect().top -
					scrollContainer.getBoundingClientRect().top +
					scrollContainer.scrollTop;
				scrollContainer.scrollTo({
					top: Math.max(0, inputTop - scrollContainer.clientHeight * 0.45),
					behavior: reducedMotion.matches ? 'auto' : 'smooth',
				});
			}, 250);
		},
		{ signal: abortController.signal },
	);
	input?.addEventListener('blur', () => window.clearTimeout(focusTimer), {
		signal: abortController.signal,
	});
	technologyTrigger?.addEventListener('click', openTechnologies, {
		signal: abortController.signal,
	});
	technologyClose?.addEventListener('click', closeTechnologies, {
		signal: abortController.signal,
	});
	technologyDialog?.addEventListener(
		'click',
		(event) => {
			if (event.target === technologyDialog) closeTechnologies();
		},
		{ signal: abortController.signal },
	);
	technologyDialog?.addEventListener('close', () => previousFocus?.focus(), {
		signal: abortController.signal,
	});

	document.addEventListener(
		'astro:before-swap',
		() => {
			previousFocus = null;
			if (technologyDialog?.open) technologyDialog.close();
			abortController.abort();
			window.clearTimeout(focusTimer);
			delete root.dataset.interactionsReady;
		},
		{ once: true },
	);
};

initializeAboutInteractions();
