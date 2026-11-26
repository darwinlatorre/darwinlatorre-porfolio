import { createClipboardFeedback } from './clipboard';
import { profile } from '../data/portfolio';
import { initializeTreeNavigation, type TreeNavigation } from './tree-navigation';
import { initializeHomeSnap } from './home-snap';
import { portfolioSections } from '../data/navigation';

const initializePageScroll = () => {
	const scroller = document.querySelector<HTMLElement>('[data-page-scroll]');
	if (!scroller || scroller.dataset.interactionsReady === 'true') return;

	scroller.dataset.interactionsReady = 'true';

	const sharedName = document.querySelector<HTMLElement>('[data-shared-name]');
	const topScrim = document.querySelector<HTMLElement>('[data-top-scrim]');
	const nameAction = sharedName?.querySelector<HTMLButtonElement>('[data-name-action]');
	const copyStatus = document.querySelector<HTMLElement>('[data-copy-status]');
	const menu = document.querySelector<HTMLElement>('[data-menu]');
	const menuTrigger = menu?.querySelector<HTMLButtonElement>('[data-menu-trigger]');
	const scrollCue = document.querySelector<HTMLAnchorElement>('[data-shared-scroll-cue]');
	const initialLabel = scrollCue?.querySelector<HTMLElement>('[data-scroll-initial]');
	const discoverLabel = scrollCue?.querySelector<HTMLElement>('[data-scroll-discover]');
	const floatingTerminal = document.querySelector<HTMLElement>('[data-terminal-floating]');
	const terminals = document.querySelectorAll<HTMLElement>('[data-terminal-root]');
	const homeDetails = document.querySelector<HTMLElement>('[data-home-details]');
	const homeDetailsContent = homeDetails?.querySelector<HTMLElement>('[data-home-details-content]');
	const treeScroll = homeDetails?.querySelector<HTMLElement>('[data-tree-scroll]');
	const about = document.querySelector<HTMLElement>('[data-about]');
	const aboutMarker = about?.querySelector<HTMLElement>('[data-about-marker]');
	const aboutLine = about?.querySelector<HTMLElement>('[data-about-line]');
	const aboutDescription = about?.querySelector<HTMLElement>('[data-about-description]');
	const aboutStatValues = about?.querySelectorAll<HTMLElement>('[data-about-stat-value]') ?? [];
	const aboutSocials = about?.querySelectorAll<HTMLElement>('[data-about-social]') ?? [];
	const experience = document.querySelector<HTMLElement>('[data-experience]');
	const experienceCommand = experience?.querySelector<HTMLElement>('[data-experience-command]');
	const experienceEntries =
		experience?.querySelectorAll<HTMLElement>('[data-experience-entry]') ?? [];
	const experienceSummary = experience?.querySelector<HTMLElement>('[data-experience-summary]');
	const projects = document.querySelector<HTMLElement>('[data-projects]');
	const projectCards = projects?.querySelectorAll<HTMLElement>('[data-project-card]') ?? [];
	const certificates = document.querySelector<HTMLElement>('[data-certificates]');
	const certificatesCommand = certificates?.querySelector<HTMLElement>(
		'[data-certificates-command]',
	);
	const certificateRules =
		certificates?.querySelectorAll<HTMLElement>('[data-certificates-rule]') ?? [];
	const certificateItems =
		certificates?.querySelectorAll<HTMLElement>('[data-certificate-item]') ?? [];
	const sectionElements = portfolioSections.flatMap(({ id }) => {
		const element = document.getElementById(id);
		return element ? [{ id, element }] : [];
	});
	const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
	const mobileViewport = window.matchMedia('(max-width: 48rem)');
	const abortController = new AbortController();
	const clipboard = nameAction
		? createClipboardFeedback({
				trigger: nameAction,
				status: copyStatus ?? null,
				value: profile.email,
			})
		: null;

	let frameId = 0;
	let measurementPending = false;
	let startFontSize = 0;
	let endFontSize = 0;
	let endTop = 0;
	let detailsTop = scroller.clientHeight;
	let aboutTop = scroller.clientHeight * 2;
	let projectsTop = scroller.clientHeight * 3;
	let experienceTop = scroller.clientHeight * 4;
	let certificatesTop = scroller.clientHeight * 5;
	let sectionTops: Array<{ id: string; top: number }> = [];
	let treeNavigation: TreeNavigation | null = null;
	let lastNameStyle = '';
	let lastRenderTop = scroller.scrollTop;
	let directionTravel = 0;
	let nameTucked = false;

	const clamp = (value: number) => Math.min(1, Math.max(0, value));
	const range = (value: number, start: number, end: number) =>
		clamp((value - start) / (end - start));
	const elementTop = (element: HTMLElement) =>
		element.getBoundingClientRect().top - scroller.getBoundingClientRect().top + scroller.scrollTop;
	// 0 when the section top enters at the viewport bottom, 1 when it reaches the top.
	const entryProgress = (top: number) => {
		const progress = clamp(
			(scroller.scrollTop - top + scroller.clientHeight) / Math.max(scroller.clientHeight, 1),
		);
		return reducedMotion.matches ? (progress >= 0.5 ? 1 : 0) : progress;
	};
	// Content reveal: 0 when the section top enters at the viewport bottom, 1 once it has risen
	// 40% of the viewport, so content is in place well before it reaches the middle. The end is
	// clamped to the last reachable scroll position so the final section always finishes.
	const revealProgress = (top: number) => {
		const height = scroller.clientHeight;
		const maxScroll = scroller.scrollHeight - height;
		const end = Math.min(top - height * 0.6, maxScroll);
		const start = Math.min(top - height, end - 1);
		const progress = clamp((scroller.scrollTop - start) / (end - start));
		return reducedMotion.matches ? (progress > 0 ? 1 : 0) : progress;
	};
	const getFragmentTarget = (hash: string) => {
		if (!hash.startsWith('#') || hash.length <= 1) return null;

		try {
			return document.getElementById(decodeURIComponent(hash.slice(1)));
		} catch {
			return null;
		}
	};
	// Last progress written per element: most frames leave reveals at 0 or 1, so skip the writes.
	const revealed = new WeakMap<HTMLElement, number>();
	const reveal = (element: HTMLElement | null | undefined, progress: number, offset = 18) => {
		if (!element || revealed.get(element) === progress) return;
		revealed.set(element, progress);
		element.style.opacity = `${progress}`;
		element.style.transform = `translateY(${offset * (1 - progress)}px)`;
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
		detailsTop = homeDetails ? elementTop(homeDetails) : scroller.clientHeight;
		aboutTop = about ? elementTop(about) : detailsTop + scroller.clientHeight;
		projectsTop = projects ? elementTop(projects) : aboutTop + scroller.clientHeight;
		experienceTop = experience ? elementTop(experience) : projectsTop + scroller.clientHeight;
		certificatesTop = certificates
			? elementTop(certificates)
			: experienceTop + scroller.clientHeight;
		sectionTops = sectionElements.map(({ id, element }) => ({ id, top: elementTop(element) }));
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
		const aboutProgress = entryProgress(aboutTop);
		const aboutReveal = revealProgress(aboutTop);
		const projectsProgress = revealProgress(projectsTop);
		const experienceProgress = revealProgress(experienceTop);
		const certificatesProgress = revealProgress(certificatesTop);
		const atPageEnd = scroller.scrollTop >= scroller.scrollHeight - scroller.clientHeight - 24;

		if (sharedName) {
			// Phones hide the name while reading down past Home; desktop keeps it pinned.
			const delta = scroller.scrollTop - lastRenderTop;
			lastRenderTop = scroller.scrollTop;
			directionTravel = Math.sign(delta) === Math.sign(directionTravel) ? directionTravel + delta : delta;
			const pastHome = scroller.scrollTop > aboutTop - scroller.clientHeight / 2;
			if (!mobileViewport.matches || !pastHome) nameTucked = false;
			else if (directionTravel > 12) nameTucked = true;
			else if (directionTravel < -12) nameTucked = false;
			sharedName.classList.toggle('is-tucked', nameTucked);
		}
		if (topScrim) {
			// The band only appears once content scrolls past the About snap point and can pass under
			// the pinned name; at the snap point itself the About command stays clear of it.
			topScrim.classList.toggle('is-visible', scroller.scrollTop > aboutTop + 8);
			topScrim.classList.toggle('is-tucked', nameTucked);
		}

		if (sharedName && nameAction) {
			const startTop = scroller.clientHeight / 2;
			const fontSize = startFontSize + (endFontSize - startFontSize) * progress;
			const top = startTop + (endTop - startTop) * progress;
			const translateY = -50 * (1 - progress);
			const nameStyle = `${top}|${fontSize}|${translateY}`;

			if (nameStyle !== lastNameStyle) {
				lastNameStyle = nameStyle;
				sharedName.style.top = `${top}px`;
				sharedName.style.fontSize = `${fontSize}px`;
				sharedName.style.transform = `translate(-50%, ${translateY}%)`;
			}
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
			const cueOpacity = 1 - range(aboutProgress, 0.05, 0.4);
			const cueHidden = cueOpacity <= 0;

			initialLabel.style.opacity = `${(1 - labelTransition) * cueOpacity}`;
			initialLabel.style.transform = `translateY(${-3 * labelTransition}px)`;
			discoverLabel.style.opacity = `${labelTransition * cueOpacity}`;
			discoverLabel.style.transform = `translateY(${3 * (1 - labelTransition)}px)`;
			scrollCue.classList.toggle('is-hidden', cueHidden);
			scrollCue.inert = cueHidden;
			scrollCue.href = inDetails ? '#about' : '#home-details';
			scrollCue.setAttribute(
				'aria-label',
				inDetails ? 'Go to the About section' : 'Go to the next Home view',
			);

			const detailsIsCurrent = Math.abs(scroller.scrollTop - detailsTop) <= 2;
			scrollCue.classList.toggle(
				'is-tree-end',
				mobileViewport.matches && detailsIsCurrent && Boolean(treeNavigation?.isAtEnd()),
			);
		}

		const currentSection = sectionTops.findLast(
			({ top }) => scroller.scrollTop + scroller.clientHeight / 2 >= top,
		);
		if (currentSection) {
			for (const terminal of terminals) terminal.dataset.terminalContext = currentSection.id;
		}

		if (floatingTerminal) {
			// Shown from About on, and put away again once the page bottom (footer) is reached.
			const terminalHidden = aboutProgress < 0.5 || atPageEnd;
			floatingTerminal.classList.toggle('is-visible', !terminalHidden);
			if (terminalHidden && document.activeElement instanceof HTMLElement && floatingTerminal.contains(document.activeElement)) {
				document.activeElement.blur();
			}
			floatingTerminal.inert = terminalHidden;
			floatingTerminal.setAttribute('aria-hidden', String(terminalHidden));
		}

		if (homeDetailsContent) {
			// Home details fade only as About takes over the screen, so the hand-off never shows a gap.
			const exitProgress = range(aboutProgress, 0.3, 0.7);
			homeDetailsContent.style.opacity = `${1 - exitProgress}`;
			homeDetailsContent.style.transform = `translateY(${-8 * exitProgress}px)`;
		}
		if (homeDetails) homeDetails.inert = aboutProgress >= 0.5;

		const markerProgress = range(aboutReveal, 0.05, 0.25);
		reveal(aboutMarker, markerProgress, 8);
		if (aboutLine) aboutLine.style.transform = `scaleY(${markerProgress})`;
		reveal(aboutDescription, range(aboutReveal, 0.15, 0.4), 22);
		const statValueProgress = range(aboutReveal, 0.3, 0.5);
		for (const value of aboutStatValues) reveal(value, statValueProgress, 12);
		aboutSocials.forEach((social, index) => {
			const start = 0.4 + index * 0.055;
			reveal(social, range(aboutReveal, start, start + 0.18), 14);
		});

		projectCards.forEach((card, index) => {
			const start = 0.15 + index * 0.1;
			reveal(card, range(projectsProgress, start, start + 0.3), 18);
		});

		reveal(experienceCommand, range(experienceProgress, 0.18, 0.38), 8);
		experienceEntries.forEach((entry, index) => {
			const start = 0.3 + index * 0.13;
			reveal(entry, range(experienceProgress, start, start + 0.24), 20);
		});
		reveal(experienceSummary, range(experienceProgress, 0.68, 0.86), 12);

		reveal(certificatesCommand, range(certificatesProgress, 0.18, 0.36), 8);
		certificateRules.forEach((rule, index) => {
			reveal(rule, range(certificatesProgress, 0.38 + index * 0.32, 0.56 + index * 0.3), 0);
		});
		certificateItems.forEach((item, index) => {
			const start = 0.44 + index * 0.065;
			reveal(item, range(certificatesProgress, start, start + 0.2), 16);
		});
	};

	const requestRender = () => {
		if (frameId) return;
		frameId = window.requestAnimationFrame(render);
	};

	const handleResize = () => {
		measurementPending = true;
		requestRender();
	};

	const homeSnap = homeDetails
		? initializeHomeSnap({ scroller, details: homeDetails, about, treeScroll, signal: abortController.signal })
		: null;
	const scrollToTop = (top: number) => {
		if (homeSnap) homeSnap.scrollTo(top);
		else scroller.scrollTo({ top, behavior: reducedMotion.matches ? 'instant' : 'smooth' });
	};
	const navigateTo = (target: HTMLElement) => scrollToTop(elementTop(target));

	if (homeDetails && treeScroll) {
		treeNavigation = initializeTreeNavigation({
			root: homeDetails,
			scrollContainer: treeScroll,
			onChange: requestRender,
			signal: abortController.signal,
		});
	}
	// Section heights change with viewport size and expanded content (e.g. experience details).
	const sectionResizeObserver =
		typeof ResizeObserver !== 'undefined' ? new ResizeObserver(handleResize) : null;
	for (const { element } of sectionElements) sectionResizeObserver?.observe(element);

	scroller.addEventListener('scroll', requestRender, {
		passive: true,
		signal: abortController.signal,
	});
	window.addEventListener('resize', handleResize, { signal: abortController.signal });
	reducedMotion.addEventListener('change', requestRender, { signal: abortController.signal });
	mobileViewport.addEventListener('change', handleResize, { signal: abortController.signal });

	nameAction?.addEventListener(
		'click',
		async () => {
			const inDetails = scroller.scrollTop / Math.max(detailsTop, 1) >= 0.5;
			if (!inDetails) {
				await clipboard?.copy();
				return;
			}

			scrollToTop(0);
		},
		{ signal: abortController.signal },
	);
	document.addEventListener(
		'portfolio:navigate',
		(event) => {
			const targetId = event.detail.target === 'home' ? 'home-details' : event.detail.target;
			const target = document.getElementById(targetId);
			if (!target) return;

			window.history.pushState(null, '', `#${targetId}`);
			navigateTo(target);
		},
		{ signal: abortController.signal },
	);
	document.addEventListener(
		'click',
		(event) => {
			if (!(event.target instanceof Element)) return;
			const link = event.target.closest<HTMLAnchorElement>('a[href^="#"]');
			if (!link || link === scrollCue) return;
			const target = getFragmentTarget(link.hash);
			if (!target) return;
			event.preventDefault();
			window.history.pushState(null, '', link.hash);
			navigateTo(target);
		},
		{ capture: true, signal: abortController.signal },
	);
	window.addEventListener(
		'hashchange',
		() => {
			const target = getFragmentTarget(location.hash);
			if (target) navigateTo(target);
		},
		{ signal: abortController.signal },
	);

	scrollCue?.addEventListener(
		'click',
		(event) => {
			event.preventDefault();
			const treeHasMore = mobileViewport.matches && treeScroll && treeNavigation && !treeNavigation.isAtEnd();
			const atDetails = Math.abs(scroller.scrollTop - detailsTop) <= 2;
			if (atDetails && treeHasMore) {
				treeScroll.scrollBy({
					top: treeScroll.clientHeight * 0.8,
					behavior: reducedMotion.matches ? 'instant' : 'smooth',
				});
				return;
			}
			const target = getFragmentTarget(scrollCue.hash);
			if (target) navigateTo(target);
		},
		{ signal: abortController.signal },
	);

	document.addEventListener(
		'astro:before-swap',
		() => {
			abortController.abort();
			treeNavigation?.disconnect();
			sectionResizeObserver?.disconnect();
			clipboard?.dispose();
			window.cancelAnimationFrame(frameId);
			delete scroller.dataset.interactionsReady;
		},
		{ once: true },
	);

	measure();
	const initialTarget = getFragmentTarget(location.hash);
	if (initialTarget) navigateTo(initialTarget);
	requestRender();

	if (!location.hash && homeDetails && scroller.scrollTop <= 2) {
		const introTimer = window.setTimeout(() => {
			if (location.hash || scroller.scrollTop > 2 || abortController.signal.aborted) return;
			navigateTo(homeDetails);
		}, 800);
		const cancelIntro = () => window.clearTimeout(introTimer);
		for (const event of ['pointerdown', 'touchstart', 'wheel', 'keydown', 'hashchange']) {
			window.addEventListener(event, cancelIntro, {
				passive: true,
				once: true,
				signal: abortController.signal,
			});
		}
		document.addEventListener('portfolio:navigate', cancelIntro, {
			once: true,
			signal: abortController.signal,
		});
		abortController.signal.addEventListener('abort', cancelIntro, { once: true });
	}
};

initializePageScroll();
document.addEventListener('astro:page-load', initializePageScroll);
