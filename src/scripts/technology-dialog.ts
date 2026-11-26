import { createDialogController } from './dialog';
import { playCue } from './sound';

const initializeTechnologyDialog = () => {
	const dialog = document.querySelector<HTMLDialogElement>('[data-technologies-dialog]');
	if (!dialog || dialog.dataset.interactionsReady === 'true') return;

	dialog.dataset.interactionsReady = 'true';
	const closeButton = dialog.querySelector<HTMLButtonElement>('[data-technologies-close]');
	const abortController = new AbortController();
	const controller = createDialogController({
		dialog,
		closeButton,
		signal: abortController.signal,
		// The popup itself renders top to bottom in chunks (see `.technology-dialog[open]`).
		onOpen: () => playCue('open'),
	});
	dialog.addEventListener('close', () => playCue('close'), { signal: abortController.signal });

	document.addEventListener('portfolio:open-technologies', controller.open, {
		signal: abortController.signal,
	});
	document.querySelectorAll<HTMLElement>('[data-technologies-open]').forEach((trigger) => {
		trigger.addEventListener('click', controller.open, { signal: abortController.signal });
	});

	document.addEventListener(
		'astro:before-swap',
		() => {
			abortController.abort();
			delete dialog.dataset.interactionsReady;
		},
		{ once: true },
	);
};

initializeTechnologyDialog();
document.addEventListener('astro:page-load', initializeTechnologyDialog);
