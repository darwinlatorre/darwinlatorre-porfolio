import { createDialogController } from './dialog';

const initializeCvDialog = () => {
	const dialog = document.querySelector<HTMLDialogElement>('[data-cv-dialog]');
	const trigger = document.querySelector<HTMLAnchorElement>('[data-cv-open]');

	if (!dialog || !trigger || dialog.dataset.cvReady === 'true') return;

	dialog.dataset.cvReady = 'true';

	const closeButton = dialog.querySelector<HTMLButtonElement>('[data-cv-close]');
	const frame = dialog.querySelector<HTMLIFrameElement>('[data-cv-frame]');
	const desktopViewport = window.matchMedia('(min-width: 48rem)');
	const abortController = new AbortController();

	const controller = createDialogController({
		dialog,
		closeButton,
		signal: abortController.signal,
		onOpen: () => {
			const src = frame?.dataset.src;
			if (frame && src && !frame.getAttribute('src')) frame.setAttribute('src', src);
		},
	});

	trigger.addEventListener(
		'click',
		(event) => {
			if (!desktopViewport.matches) return;
			event.preventDefault();
			controller.open();
		},
		{ signal: abortController.signal },
	);

	document.addEventListener(
		'astro:before-swap',
		() => {
			abortController.abort();
			delete dialog.dataset.cvReady;
		},
		{ once: true },
	);
};

initializeCvDialog();
document.addEventListener('astro:page-load', initializeCvDialog);
