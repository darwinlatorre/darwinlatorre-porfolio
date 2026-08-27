import { createClipboardFeedback } from './clipboard';
import { initializeTreeNavigation, type TreeNavigation } from './tree-navigation';

const initializePageScroll = () => {
	const scroller = document.querySelector<HTMLElement>('[data-page-scroll]');
	if (!scroller || scroller.dataset.interactionsReady === 'true') return;

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
	const homeDetailsContent = homeDetails?.querySelector<HTMLElement>('[data-home-details-content]');
	const treeScroll = homeDetails?.querySelector<HTMLElement>('[data-tree-scroll]');
	const about = document.querySelector<HTMLElement>('[data-about]');
	const aboutContent = about?.querySelector<HTMLElement>('[data-about-content]');
	const aboutMarker = about?.querySelector<HTMLElement>('[data-about-marker]');
	const aboutLine = about?.querySelector<HTMLElement>('[data-about-line]');
	const aboutDescription = about?.querySelector<HTMLElement>('[data-about-description]');
	const aboutStatCommand = about?.querySelector<HTMLElement>('[data-about-stat-command]');
	const aboutSocialCommand = about?.querySelector<HTMLElement>('[data-about-social-command]');
	const aboutTerminalCommand = about?.querySelector<HTMLElement>('[data-about-terminal-command]');
	const aboutStatValues = about?.querySelectorAll<HTMLElement>('[data-about-stat-value]') ?? [];
	const aboutSocials = about?.querySelectorAll<HTMLElement>('[data-about-social]') ?? [];
	const technologyDialog = about?.querySelector<HTMLDialogElement>('[data-technologies-dialog]');
	const experience = document.querySelector<HTMLElement>('[data-experience]');
	const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
	const mobileViewport = window.matchMedia('(max-width: 48rem)');
	const abortController = new AbortController();
	const clipboard = nameAction
		? createClipboardFeedback({
				trigger: nameAction,
				status: copyStatus ?? null,
				value: 'contact@darwinlatorre.com',
			})
		: null;

	let frameId = 0;
	let measurementPending = false;
	let startFontSize = 0;
	let endFontSize = 0;
	let endTop = 0;
	let detailsTop = scroller.clientHeight;
	let aboutTop = scroller.clientHeight * 2;
	let experienceTop = scroller.clientHeight * 3;
	let bypassAboutLock = false;
	let bypassTimer = 0;
	let treeNavigation: TreeNavigation | null = null;

	const clamp = (value: number) => Math.min(1, Math.max(0, value));
	const range = (value: number, start: number, end: number) =>
		clamp((value - start) / (end - start));
	const getFragmentTarget = (hash: string) => {
		if (!hash.startsWith('#') || hash.length <= 1) return null;

		try {
			return document.getElementById(decodeURIComponent(hash.slice(1)));
		} catch {
			return null;
		}
	};
	const reveal = (element: HTMLElement | null | undefined, progress: number, offset = 18) => {
		if (!element) return;
		element.style.opacity = `${progress}`;
		element.style.transform = `translateY(${offset * (1 - progress)}px)`;
	};
	const beginProgrammaticNavigation = () => {
		bypassAboutLock = true;
		window.clearTimeout(bypassTimer);
		bypassTimer = window.setTimeout(() => {
			bypassAboutLock = false;
		}, 1500);
	};
	const endProgrammaticNavigation = () => {
		bypassAboutLock = false;
		window.clearTimeout(bypassTimer);
	};
	const getAboutScrollState = () => {
		if (!aboutContent) return { scrollable: false, atStart: true, atEnd: true };

		const scrollable = aboutContent.scrollHeight > aboutContent.clientHeight + 1;
		return {
			scrollable,
			atStart: !scrollable || aboutContent.scrollTop <= 1,
			atEnd:
				!scrollable ||
				aboutContent.scrollTop + aboutContent.clientHeight >= aboutContent.scrollHeight - 1,
		};
	};

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
		aboutTop = about
			? about.getBoundingClientRect().top + scroller.scrollTop
			: detailsTop + scroller.clientHeight;
		experienceTop = experience
			? experience.getBoundingClientRect().top + scroller.scrollTop
			: aboutTop + scroller.clientHeight;
	};

	const render = () => {
		frameId = 0;
		if (measurementPending) {
			measurementPending = false;
			measure();
		}
		const rawProgress = clamp(scroller.scrollTop / Math.max(detailsTop, 1));
		const progress = reducedMotion.matches ? (rawProgress >= 0.5 ? 1 : 0) : rawProgress;
		const inDetails = rawProgress >= 0.5;
		const rawAboutProgress = clamp(
			(scroller.scrollTop - detailsTop) / Math.max(aboutTop - detailsTop, 1),
		);
		const aboutProgress = reducedMotion.matches
			? rawAboutProgress >= 0.5
				? 1
				: 0
			: rawAboutProgress;
		const inExperience = scroller.scrollTop >= experienceTop - 2;
		const inAbout = scroller.scrollTop >= aboutTop - 2 && !inExperience;
		const aboutScrollState = getAboutScrollState();

		aboutContent?.classList.toggle(
			'is-scroll-contained',
			aboutScrollState.scrollable &&
				!aboutScrollState.atStart &&
				!aboutScrollState.atEnd,
		);

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
			const detailsEntry = Math.min(1, progress * 1.5);
			const laterSectionEntry = range(aboutProgress, 0.12, 0.42);
			const menuVisibility = Math.max(1 - detailsEntry, laterSectionEntry);
			const menuIsHidden = menuVisibility <= 0.5;

			menu.style.opacity = `${menuVisibility}`;

			if (menuIsHidden && menuTrigger?.getAttribute('aria-expanded') === 'true') {
				menu.dispatchEvent(new Event('menu:close'));
			}
			if (menuIsHidden && document.activeElement instanceof Node && menu.contains(document.activeElement)) {
				nameAction?.focus({ preventScroll: true });
			}
			menu.inert = menuIsHidden;
			menu.setAttribute('aria-hidden', String(menuIsHidden));
		}

		if (scrollCue && initialLabel && discoverLabel) {
			const labelTransition = reducedMotion.matches
				? rawProgress >= 0.85
					? 1
					: 0
				: clamp((rawProgress - 0.65) / 0.35);

			const aboutLabelOpacity = 1 - range(aboutProgress, 0.05, 0.4);

			initialLabel.style.opacity = `${(1 - labelTransition) * aboutLabelOpacity}`;
			initialLabel.style.transform = `translateY(${-3 * labelTransition}px)`;
			discoverLabel.style.opacity = `${labelTransition * aboutLabelOpacity}`;
			discoverLabel.style.transform = `translateY(${3 * (1 - labelTransition)}px)`;
			scrollCue.classList.toggle('is-terminal', inExperience);
			if (inExperience) {
				scrollCue.removeAttribute('href');
				scrollCue.setAttribute('aria-label', 'End of current portfolio content');
			} else if (inAbout) {
				if (aboutScrollState.atEnd) {
					scrollCue.href = '#experience';
					scrollCue.setAttribute('aria-label', 'Go to the Experience section');
				} else {
					scrollCue.href = '#about';
					scrollCue.setAttribute('aria-label', 'Continue through the About content');
				}
			} else {
				scrollCue.href = inDetails ? '#about' : '#home-details';
				scrollCue.setAttribute(
					'aria-label',
					inDetails ? 'Go to the About section' : 'Go to the next Home view',
				);
			}

			const detailsIsCurrent = Math.abs(scroller.scrollTop - detailsTop) <= 2;
			scrollCue.classList.toggle(
				'is-tree-end',
				mobileViewport.matches && detailsIsCurrent && Boolean(treeNavigation?.isAtEnd()),
			);
		}

		if (homeDetailsContent) {
			const exitProgress = range(aboutProgress, 0, 0.2);
			homeDetailsContent.style.opacity = `${1 - exitProgress}`;
			homeDetailsContent.style.transform = `translateY(${-8 * exitProgress}px)`;
		}
		if (homeDetails) homeDetails.inert = aboutProgress >= 0.2;

		const markerProgress = range(aboutProgress, 0.2, 0.4);
		if (about) {
			const aboutIsInteractive = aboutProgress >= 0.65 && !inExperience;
			about.inert = !aboutIsInteractive;
		}
		reveal(aboutMarker, markerProgress, 8);
		if (aboutLine) aboutLine.style.transform = `scaleY(${markerProgress})`;
		reveal(aboutDescription, range(aboutProgress, 0.35, 0.6), 22);

		reveal(aboutStatCommand, range(aboutProgress, 0.48, 0.64), 10);
		const statValueProgress = range(aboutProgress, 0.55, 0.74);
		for (const value of aboutStatValues) reveal(value, statValueProgress, 14);
		reveal(aboutSocialCommand, range(aboutProgress, 0.62, 0.76), 10);
		aboutSocials.forEach((social, index) => {
			const start = 0.65 + index * 0.055;
			reveal(social, range(aboutProgress, start, start + 0.18), 14);
		});
		reveal(aboutTerminalCommand, range(aboutProgress, 0.82, 0.98), 10);
	};

	const requestRender = () => {
		if (frameId) return;
		frameId = window.requestAnimationFrame(render);
	};
	const enforceAboutBoundary = () => {
		if (!aboutContent || bypassAboutLock) return;

		const { atStart, atEnd } = getAboutScrollState();
		const pageTop = scroller.scrollTop;
		const movingBelowAbout = pageTop > aboutTop + 2;
		const movingAboveAbout = pageTop < aboutTop - 2;

		if ((movingBelowAbout && !atEnd) || (movingAboveAbout && !atStart)) {
			aboutContent.scrollTop += pageTop - aboutTop;
			scroller.scrollTop = aboutTop;
		}
	};
	const handlePageScroll = () => {
		enforceAboutBoundary();
		requestRender();
	};

	const handleResize = () => {
		measurementPending = true;
		requestRender();
	};

	if (homeDetails && treeScroll) {
		treeNavigation = initializeTreeNavigation({
			root: homeDetails,
			scrollContainer: treeScroll,
			onChange: requestRender,
			signal: abortController.signal,
		});
	}
	const aboutResizeObserver =
		aboutContent && typeof ResizeObserver !== 'undefined'
			? new ResizeObserver(requestRender)
			: null;
	if (aboutContent) {
		aboutResizeObserver?.observe(aboutContent);
		if (aboutContent.firstElementChild) {
			aboutResizeObserver?.observe(aboutContent.firstElementChild);
		}
	}

	scroller.addEventListener('scroll', handlePageScroll, {
		passive: true,
		signal: abortController.signal,
	});
	scroller.addEventListener('scrollend', endProgrammaticNavigation, {
		signal: abortController.signal,
	});
	aboutContent?.addEventListener('scroll', requestRender, {
		passive: true,
		signal: abortController.signal,
	});
	window.addEventListener('resize', handleResize, { signal: abortController.signal });
	reducedMotion.addEventListener('change', requestRender, { signal: abortController.signal });
	mobileViewport.addEventListener('change', requestRender, { signal: abortController.signal });
	document.addEventListener(
		'keydown',
		(event) => {
			if (!aboutContent) return;
			if (technologyDialog?.open || event.target !== aboutContent) return;
			const inExperience = scroller.scrollTop >= experienceTop - 2;
			const inAbout = scroller.scrollTop >= aboutTop - 2 && !inExperience;
			if (!inAbout) return;
			const { atStart, atEnd } = getAboutScrollState();
			let amount = 0;
			if (event.key === 'ArrowDown') amount = 48;
			if (event.key === 'ArrowUp') amount = -48;
			if (event.key === 'PageDown' || (event.key === ' ' && !event.shiftKey)) {
				amount = aboutContent.clientHeight * 0.8;
			}
			if (event.key === 'PageUp' || (event.key === ' ' && event.shiftKey)) {
				amount = aboutContent.clientHeight * -0.8;
			}

			if ((amount > 0 && !atEnd) || (amount < 0 && !atStart)) {
				event.preventDefault();
				aboutContent.scrollBy({
					top: amount,
					behavior: reducedMotion.matches ? 'auto' : 'smooth',
				});
			}
		},
		{ signal: abortController.signal },
	);

	nameAction?.addEventListener(
		'click',
		async () => {
			const inDetails = scroller.scrollTop / Math.max(detailsTop, 1) >= 0.5;
			if (!inDetails) {
				await clipboard?.copy();
				return;
			}

			beginProgrammaticNavigation();
			document.querySelector('#home')?.scrollIntoView({
				behavior: reducedMotion.matches ? 'auto' : 'smooth',
				block: 'start',
			});
		},
		{ signal: abortController.signal },
	);
	document.addEventListener(
		'click',
		(event) => {
			if (!(event.target instanceof Element)) return;
			const link = event.target.closest<HTMLAnchorElement>('a[href^="#"]');
			if (!link || link === scrollCue) return;
			if (!getFragmentTarget(link.hash)) return;
			beginProgrammaticNavigation();
		},
		{ capture: true, signal: abortController.signal },
	);
	window.addEventListener(
		'hashchange',
		() => {
			if (getFragmentTarget(location.hash)) beginProgrammaticNavigation();
		},
		{ signal: abortController.signal },
	);

	scrollCue?.addEventListener(
		'click',
		(event) => {
			const inDetails = scroller.scrollTop / Math.max(detailsTop, 1) >= 0.5;
			const inExperience = scroller.scrollTop >= experienceTop - 2;
			const inAbout = scroller.scrollTop >= aboutTop - 2 && !inExperience;
			if (inExperience) return;

			const aboutScrollState = getAboutScrollState();
			if (inAbout && !aboutScrollState.atEnd) {
				event.preventDefault();
				aboutContent?.scrollBy({
					top: aboutContent.clientHeight * 0.8,
					behavior: reducedMotion.matches ? 'auto' : 'smooth',
				});
				return;
			}

			const target = document.querySelector(
				inAbout ? '#experience' : inDetails ? '#about' : '#home-details',
			);
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
			treeNavigation?.disconnect();
			aboutResizeObserver?.disconnect();
			clipboard?.dispose();
			window.cancelAnimationFrame(frameId);
			window.clearTimeout(bypassTimer);
			delete scroller.dataset.interactionsReady;
		},
		{ once: true },
	);

	if (getFragmentTarget(location.hash)) beginProgrammaticNavigation();
	measure();
	enforceAboutBoundary();
	render();
};

initializePageScroll();
