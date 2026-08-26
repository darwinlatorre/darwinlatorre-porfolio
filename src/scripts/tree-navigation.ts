interface TreeNavigationOptions {
	root: HTMLElement;
	scrollContainer: HTMLElement;
	onChange: () => void;
	signal: AbortSignal;
}

export interface TreeNavigation {
	isAtEnd: () => boolean;
	disconnect: () => void;
}

export const initializeTreeNavigation = ({
	root,
	scrollContainer,
	onChange,
	signal,
}: TreeNavigationOptions): TreeNavigation => {
	const treeGroups = root.querySelectorAll<HTMLElement>('[data-tree-group]');

	for (const group of treeGroups) {
		const toggle = group.querySelector<HTMLButtonElement>('[data-tree-toggle]');
		const children = group.querySelector<HTMLElement>('.tree-children');

		if (!toggle || !children || toggle.getAttribute('aria-controls') !== children.id) continue;

		toggle.addEventListener(
			'click',
			() => {
				const expanded = toggle.getAttribute('aria-expanded') === 'true';
				toggle.setAttribute('aria-expanded', String(!expanded));
				group.classList.toggle('is-collapsed', expanded);
				children.inert = expanded;
				children.setAttribute('aria-hidden', String(expanded));
				onChange();
			},
			{ signal },
		);
	}

	scrollContainer.addEventListener('scroll', onChange, { passive: true, signal });

	const resizeObserver =
		typeof ResizeObserver !== 'undefined' ? new ResizeObserver(onChange) : null;
	resizeObserver?.observe(scrollContainer);
	if (scrollContainer.firstElementChild) {
		resizeObserver?.observe(scrollContainer.firstElementChild);
	}

	return {
		isAtEnd: () =>
			scrollContainer.scrollTop + scrollContainer.clientHeight >=
			scrollContainer.scrollHeight - 1,
		disconnect: () => resizeObserver?.disconnect(),
	};
};
