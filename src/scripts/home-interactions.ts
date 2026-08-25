const initializeHomeInteractions = () => {
	const scroller = document.querySelector<HTMLElement>('[data-page-scroll]');

	if (scroller && scroller.dataset.interactionsReady !== 'true') {
		scroller.dataset.interactionsReady = 'true';

		const sharedName = document.querySelector<HTMLElement>('[data-shared-name]');
		const nameAction = sharedName?.querySelector<HTMLButtonElement>('[data-name-action]');
		const copyStatus = document.querySelector<HTMLElement>('[data-copy-status]');
		const menu = document.querySelector<HTMLElement>('[data-menu]');
		const menuTrigger = menu?.querySelector<HTMLButtonElement>('[data-menu-trigger]');
		const scrollCue = document.querySelector<HTMLAnchorElement>('[data-shared-scroll-cue]');
		const initialLabel = scrollCue?.querySelector<HTMLElement>('[data-scroll-initial]');
		const discoverLabel = scrollCue?.querySelector<HTMLElement>('[data-scroll-discover]');
		const homeDetails = document.querySelector<HTMLElement>('[data-home-details]');
		const treeScroll = homeDetails?.querySelector<HTMLElement>('[data-tree-scroll]');
		const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
		const mobileViewport = window.matchMedia('(max-width: 48rem)');
		const abortController = new AbortController();

		let frameId = 0;
		let feedbackTimer = 0;
		let startFontSize = 0;
		let endFontSize = 0;
		let endTop = 0;
		let detailsTop = scroller.clientHeight;

		const clamp = (value: number) => Math.min(1, Math.max(0, value));

		const measure = () => {
			if (sharedName) {
				const currentFontSize = sharedName.style.fontSize;
				sharedName.style.fontSize = '';
				startFontSize = Number.parseFloat(getComputedStyle(sharedName).fontSize);
				sharedName.style.fontSize = currentFontSize;
				endFontSize = window.innerWidth <= 640 ? 13 : 15;
			}

			endTop = menu ? Number.parseFloat(getComputedStyle(menu).top) : 24;
			detailsTop = homeDetails
				? homeDetails.getBoundingClientRect().top + scroller.scrollTop
				: scroller.clientHeight;
		};

		const render = () => {
			frameId = 0;
			const rawProgress = clamp(scroller.scrollTop / Math.max(detailsTop, 1));
			const progress = reducedMotion.matches ? (rawProgress >= 0.5 ? 1 : 0) : rawProgress;
			const inDetails = rawProgress >= 0.5;

			if (sharedName && nameAction) {
				const startTop = scroller.clientHeight / 2;
				const fontSize = startFontSize + (endFontSize - startFontSize) * progress;
				const top = startTop + (endTop - startTop) * progress;
				const translateY = -50 * (1 - progress);

				sharedName.style.top = `${top}px`;
				sharedName.style.fontSize = `${fontSize}px`;
				sharedName.style.transform = `translate(-50%, ${translateY}%)`;
				nameAction.setAttribute(
					'aria-label',
					inDetails
						? 'Darwinlatorre - return to Home'
						: 'Darwinlatorre - copy contact email address',
				);
			}

			if (menu) {
				const menuProgress = Math.min(1, progress * 1.5);

				menu.style.opacity = `${1 - menuProgress}`;
				menu.inert = menuProgress > 0.5;
				menu.setAttribute('aria-hidden', String(menuProgress > 0.5));

				if (menuProgress > 0 && menuTrigger?.getAttribute('aria-expanded') === 'true') {
					menuTrigger.click();
				}
			}

			if (scrollCue && initialLabel && discoverLabel) {
				const labelTransition = reducedMotion.matches
					? rawProgress >= 0.85
						? 1
						: 0
					: clamp((rawProgress - 0.65) / 0.35);

				initialLabel.style.opacity = `${1 - labelTransition}`;
				initialLabel.style.transform = `translateY(${-3 * labelTransition}px)`;
				discoverLabel.style.opacity = `${labelTransition}`;
				discoverLabel.style.transform = `translateY(${3 * (1 - labelTransition)}px)`;
				scrollCue.href = inDetails ? '#about' : '#home-details';
				scrollCue.setAttribute(
					'aria-label',
					inDetails ? 'Go to the About section' : 'Go to the next Home view',
				);

				const treeAtEnd = treeScroll
					? treeScroll.scrollTop + treeScroll.clientHeight >= treeScroll.scrollHeight - 1
					: false;
				const detailsIsCurrent = Math.abs(scroller.scrollTop - detailsTop) <= 2;

				scrollCue.classList.toggle(
					'is-tree-end',
					mobileViewport.matches && detailsIsCurrent && treeAtEnd,
				);
			}
		};

		const requestRender = () => {
			if (frameId) return;
			frameId = window.requestAnimationFrame(render);
		};

		const handleResize = () => {
			measure();
			requestRender();
		};

		const resizeObserver =
			treeScroll && typeof ResizeObserver !== 'undefined'
				? new ResizeObserver(requestRender)
				: null;
		if (treeScroll) {
			resizeObserver?.observe(treeScroll);
			if (treeScroll.firstElementChild) resizeObserver?.observe(treeScroll.firstElementChild);
		}

		scroller.addEventListener('scroll', requestRender, {
			passive: true,
			signal: abortController.signal,
		});
		treeScroll?.addEventListener('scroll', requestRender, {
			passive: true,
			signal: abortController.signal,
		});
		window.addEventListener('resize', handleResize, { signal: abortController.signal });
		reducedMotion.addEventListener('change', requestRender, { signal: abortController.signal });
		mobileViewport.addEventListener('change', requestRender, { signal: abortController.signal });

		nameAction?.addEventListener(
			'click',
			async () => {
				const inDetails = scroller.scrollTop / Math.max(detailsTop, 1) >= 0.5;

				if (inDetails) {
					document.querySelector('#home')?.scrollIntoView({
						behavior: reducedMotion.matches ? 'auto' : 'smooth',
						block: 'start',
					});
					return;
				}

				const email = 'contact@darwinlatorre.com';
				let copied: boolean;

				try {
					await navigator.clipboard.writeText(email);
					copied = true;
				} catch {
					const textarea = document.createElement('textarea');
					textarea.value = email;
					textarea.style.position = 'fixed';
					textarea.style.opacity = '0';
					document.body.append(textarea);
					textarea.select();

					try {
						copied = document.execCommand('copy');
					} catch {
						copied = false;
					} finally {
						textarea.remove();
					}
				}

				nameAction.dataset.copied = String(copied);
				if (copyStatus) copyStatus.textContent = copied ? 'Email copied' : 'Unable to copy email';
				window.clearTimeout(feedbackTimer);
				feedbackTimer = window.setTimeout(() => {
					delete nameAction.dataset.copied;
					if (copyStatus) copyStatus.textContent = '';
				}, 1200);
			},
			{ signal: abortController.signal },
		);

		scrollCue?.addEventListener(
			'click',
			(event) => {
				const inDetails = scroller.scrollTop / Math.max(detailsTop, 1) >= 0.5;
				const target = document.querySelector(inDetails ? '#about' : '#home-details');
				if (!target) return;

				event.preventDefault();
				target.scrollIntoView({
					behavior: reducedMotion.matches ? 'auto' : 'smooth',
					block: 'start',
				});
			},
			{ signal: abortController.signal },
		);

		document.addEventListener(
			'astro:before-swap',
			() => {
				abortController.abort();
				resizeObserver?.disconnect();
				window.cancelAnimationFrame(frameId);
				window.clearTimeout(feedbackTimer);
				delete scroller.dataset.interactionsReady;
			},
			{ once: true },
		);

		measure();
		render();
	}
};

initializeHomeInteractions();
