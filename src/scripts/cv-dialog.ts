const initializeCvDialog = () => {
	const dialog = document.querySelector<HTMLDialogElement>('[data-cv-dialog]');
	const trigger = document.querySelector<HTMLAnchorElement>('[data-cv-open]');

	if (!dialog || !trigger || dialog.dataset.cvReady === 'true') return;

	dialog.dataset.cvReady = 'true';

	const closeButton = dialog.querySelector<HTMLButtonElement>('[data-cv-close]');
	const frame = dialog.querySelector<HTMLIFrameElement>('[data-cv-frame]');
	const desktopViewport = window.matchMedia('(min-width: 48rem)');
	const abortController = new AbortController();

	let previousFocus: HTMLElement | null = null;

	const openDialog = () => {
		if (dialog.open) return;

		const src = frame?.dataset.src;
		if (frame && src && !frame.getAttribute('src')) frame.setAttribute('src', src);

		previousFocus = document.activeElement instanceof HTMLElement ? document.activeElement : null;
		dialog.showModal();
	};
	const closeDialog = () => dialog.close();

	trigger.addEventListener(
		'click',
		(event) => {
			if (!desktopViewport.matches) return;
			event.preventDefault();
			openDialog();
		},
		{ signal: abortController.signal },
	);
	closeButton?.addEventListener('click', closeDialog, { signal: abortController.signal });
	dialog.addEventListener(
		'click',
		(event) => {
			if (event.target === dialog) closeDialog();
		},
		{ signal: abortController.signal },
	);
	dialog.addEventListener('close', () => previousFocus?.focus(), {
		signal: abortController.signal,
	});

	document.addEventListener(
		'astro:before-swap',
		() => {
			previousFocus = null;
			if (dialog.open) dialog.close();
			abortController.abort();
			delete dialog.dataset.cvReady;
		},
		{ once: true },
	);
};

initializeCvDialog();
