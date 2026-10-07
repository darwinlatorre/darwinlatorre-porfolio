interface ClipboardFeedbackOptions {
	trigger: HTMLElement;
	status: HTMLElement | null;
	value: string;
}

export const createClipboardFeedback = ({
	trigger,
	status,
	value,
}: ClipboardFeedbackOptions) => {
	let feedbackTimer = 0;
	let disposed = false;

	const copy = async () => {
		if (disposed) return;
		let copied: boolean;

		try {
			await navigator.clipboard.writeText(value);
			copied = true;
		} catch {
			copied = false;
		}
		if (disposed) return;

		trigger.dataset.copied = String(copied);
		if (status) status.textContent = copied ? 'Email copied' : 'Unable to copy email';
		window.clearTimeout(feedbackTimer);
		feedbackTimer = window.setTimeout(() => {
			delete trigger.dataset.copied;
			if (status) status.textContent = '';
		}, 1200);
	};

	return {
		copy,
		dispose: () => {
			disposed = true;
			window.clearTimeout(feedbackTimer);
			delete trigger.dataset.copied;
			if (status) status.textContent = '';
		},
	};
};
