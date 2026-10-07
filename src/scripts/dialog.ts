interface DialogOptions {
	dialog: HTMLDialogElement;
	closeButton: HTMLButtonElement | null;
	signal: AbortSignal;
	onOpen?: () => void;
}

export const createDialogController = ({ dialog, closeButton, signal, onOpen }: DialogOptions) => {
	let previousFocus: HTMLElement | null = null;
	const close = () => dialog.close();

	closeButton?.addEventListener('click', close, { signal });
	dialog.addEventListener('click', (event) => {
		if (event.target === dialog) close();
	}, { signal });
	dialog.addEventListener('close', () => {
		previousFocus?.focus({ preventScroll: true });
		previousFocus = null;
	}, { signal });
	signal.addEventListener('abort', () => {
		// Closing during a page swap must not refocus an element in the outgoing page.
		previousFocus = null;
		if (dialog.open) dialog.close();
	}, { once: true });

	return {
		open: () => {
			if (dialog.open) return;
			onOpen?.();
			previousFocus = document.activeElement instanceof HTMLElement ? document.activeElement : null;
			dialog.showModal();
		},
	};
};
