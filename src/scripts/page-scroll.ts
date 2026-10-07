import { createClipboardFeedback } from './clipboard';
import { profile } from '../data/portfolio';
import { initializeTreeNavigation, type TreeNavigation } from './tree-navigation';
import { initializeSectionScroll } from './section-scroll';
import { portfolioSections } from '../data/navigation';

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
	const experience = document.querySelector<HTMLElement>('[data-experience]');
	const experienceContent = experience?.querySelector<HTMLElement>('[data-experience-content]');
	const experienceCommand = experience?.querySelector<HTMLElement>('[data-experience-command]');
	const experienceEntries =
		experience?.querySelectorAll<HTMLElement>('[data-experience-entry]') ?? [];
	const experienceSummary = experience?.querySelector<HTMLElement>('[data-experience-summary]');
	const experienceReady = experience?.querySelector<HTMLElement>('[data-experience-ready]');
	const services = document.querySelector<HTMLElement>('[data-services]');
	const servicesContent = services?.querySelector<HTMLElement>('[data-services-content]');
	const servicesTitle = services?.querySelector<HTMLElement>('[data-services-title]');
	const serviceCards = services?.querySelectorAll<HTMLElement>('[data-service-card]') ?? [];
	const servicesTerminal = services?.querySelector<HTMLElement>('[data-services-terminal]');
	const projects = document.querySelector<HTMLElement>('[data-projects]');
	const projectsContent = projects?.querySelector<HTMLElement>('[data-projects-content]');
	const projectCards = projects?.querySelectorAll<HTMLElement>('[data-project-card]') ?? [];
	const certificates = document.querySelector<HTMLElement>('[data-certificates]');
	const certificatesContent = certificates?.querySelector<HTMLElement>(
		'[data-certificates-content]',
	);
	const certificatesCommand = certificates?.querySelector<HTMLElement>(
		'[data-certificates-command]',
	);
	const certificateRules =
		certificates?.querySelectorAll<HTMLElement>('[data-certificates-rule]') ?? [];
	const certificateItems =
		certificates?.querySelectorAll<HTMLElement>('[data-certificate-item]') ?? [];
	const certificatesReady = certificates?.querySelector<HTMLElement>('[data-certificates-ready]');
	const contentBySection = {
		about: aboutContent,
		projects: projectsContent,
		experience: experienceContent,
		services: servicesContent,
		certificates: certificatesContent,
	};
	const contentSections = portfolioSections.flatMap((section) => section.id === 'home' ? [] : [{
		...section,
		content: contentBySection[section.id],
	}]);
	const contentPanes = contentSections.map(({ content }) => content)
		.filter((content): content is HTMLElement => Boolean(content));
	const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
	const mobileViewport = window.matchMedia('(max-width: 48rem)');
	const abortController = new AbortController();
	const paneFocusTargets = Array.from(scroller.querySelectorAll<HTMLElement>(
		'[data-about-content], [data-projects-content], [data-experience-content], ' +
		'[data-services-content], [data-certificates-content], .description-output p[tabindex]',
	)).map((element) => ({ element, tabindex: element.getAttribute('tabindex') }));
	const updatePaneFocusability = () => {
		for (const { element, tabindex } of paneFocusTargets) {
			if (mobileViewport.matches || tabindex === null) element.removeAttribute('tabindex');
			else element.setAttribute('tabindex', tabindex);
		}
	};
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
	let servicesTop = scroller.clientHeight * 5;
	let certificatesTop = scroller.clientHeight * 6;
	let treeNavigation: TreeNavigation | null = null;

	const clamp = (value: number) => Math.min(1, Math.max(0, value));
	const range = (value: number, start: number, end: number) =>
		clamp((value - start) / (end - start));
	const sectionProgress = (start: number, end: number) => {
		const progress = clamp((scroller.scrollTop - start) / Math.max(end - start, 1));
		return reducedMotion.matches ? (progress >= 0.5 ? 1 : 0) : progress;
	};
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
	const getScrollState = (content: HTMLElement | null | undefined) => {
		if (!content) return { scrollable: false, atStart: true, atEnd: true };

		const scrollable = content.scrollHeight > content.clientHeight + 1;
		return {
			scrollable,
			atStart: !scrollable || content.scrollTop <= 1,
			atEnd:
				!scrollable ||
				content.scrollTop + content.clientHeight >= content.scrollHeight - 1,
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
		projectsTop = projects
			? projects.getBoundingClientRect().top + scroller.scrollTop
			: aboutTop + scroller.clientHeight;
		experienceTop = experience
			? experience.getBoundingClientRect().top + scroller.scrollTop
			: projectsTop + scroller.clientHeight;
		servicesTop = services
			? services.getBoundingClientRect().top + scroller.scrollTop
			: experienceTop + scroller.clientHeight;
		certificatesTop = certificates
			? certificates.getBoundingClientRect().top + scroller.scrollTop
			: servicesTop + scroller.clientHeight;
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
		const aboutProgress = sectionProgress(detailsTop, aboutTop);
		const projectsProgress = sectionProgress(aboutTop, projectsTop);
		const experienceProgress = sectionProgress(projectsTop, experienceTop);
		const servicesProgress = sectionProgress(experienceTop, servicesTop);
		const certificatesProgress = sectionProgress(servicesTop, certificatesTop);
		const sectionTops = {
			about: aboutTop,
			projects: projectsTop,
			experience: experienceTop,
			services: servicesTop,
			certificates: certificatesTop,
		};
		const sectionStates = contentSections.map((section) => ({
			...section,
			top: sectionTops[section.id],
			scrollState: getScrollState(section.content),
		}));
		const currentSectionIndex = sectionStates.findLastIndex(({ top }) => scroller.scrollTop >= top - 2);
		const currentSection = sectionStates[currentSectionIndex];
		const nextSection = sectionStates[currentSectionIndex + 1];

		for (const { content, scrollState } of sectionStates) {
			content?.classList.toggle('is-scroll-contained',
				scrollState.scrollable && !scrollState.atStart && !scrollState.atEnd);
		}

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
			const atPageEnd =
				scroller.scrollTop + scroller.clientHeight >= scroller.scrollHeight - 2;

			scrollCue.classList.toggle('is-terminal', atPageEnd);
			scrollCue.classList.toggle('is-hidden', atPageEnd);
			scrollCue.inert = atPageEnd;
			if (atPageEnd) {
				scrollCue.removeAttribute('href');
				scrollCue.setAttribute('aria-label', 'End of current portfolio content');
			} else if (currentSection) {
				if (currentSection.scrollState.atEnd) {
					scrollCue.href = `#${nextSection?.id ?? 'site-footer'}`;
					scrollCue.setAttribute('aria-label', nextSection
						? `Go to the ${nextSection.label} section` : 'Go to the site footer');
				} else {
					scrollCue.href = `#${currentSection.id}`;
					scrollCue.setAttribute('aria-label', `Continue through the ${currentSection.label} content`);
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

		if (about) about.inert = aboutProgress < 0.65 || projectsProgress >= 0.2;
		if (experience) {
			experience.inert = experienceProgress < 0.65 || servicesProgress >= 0.2;
		}
		reveal(experienceCommand, range(experienceProgress, 0.18, 0.38), 8);
		experienceEntries.forEach((entry, index) => {
			const start = 0.3 + index * 0.13;
			reveal(entry, range(experienceProgress, start, start + 0.24), 20);
		});
		reveal(experienceSummary, range(experienceProgress, 0.68, 0.86), 12);
		reveal(experienceReady, range(experienceProgress, 0.82, 0.98), 8);

		if (services) services.inert = servicesProgress < 0.65 || certificatesProgress >= 0.2;
		reveal(servicesTitle, range(servicesProgress, 0.16, 0.34), 10);
		serviceCards.forEach((card, index) => {
			const start = 0.28 + index * 0.1;
			reveal(card, range(servicesProgress, start, start + 0.3), 22);
		});
		reveal(servicesTerminal, range(servicesProgress, 0.76, 0.96), 8);

		if (projects) projects.inert = projectsProgress < 0.65 || experienceProgress >= 0.2;
		projectCards.forEach((card, index) => {
			const start = 0.3 + index * 0.12;
			reveal(card, range(projectsProgress, start, start + 0.3), 18);
		});
		if (certificates) certificates.inert = certificatesProgress < 0.65;
		reveal(certificatesCommand, range(certificatesProgress, 0.18, 0.36), 8);
		certificateRules.forEach((rule, index) => {
			reveal(rule, range(certificatesProgress, 0.38 + index * 0.32, 0.56 + index * 0.3), 0);
		});
		certificateItems.forEach((item, index) => {
			const start = 0.44 + index * 0.065;
			reveal(item, range(certificatesProgress, start, start + 0.2), 16);
		});
		reveal(certificatesReady, range(certificatesProgress, 0.82, 0.98), 8);
	};

	const requestRender = () => {
		if (frameId) return;
		frameId = window.requestAnimationFrame(render);
	};

	const handleResize = () => {
		measurementPending = true;
		requestRender();
	};

	const sectionScroll = initializeSectionScroll({
		scroller, mobileViewport,
		signal: abortController.signal,
		onNavigate: () => {
			// Update inert states before section-scroll restores keyboard focus.
			window.cancelAnimationFrame(frameId);
			render();
		},
	});

	if (homeDetails && treeScroll) {
		treeNavigation = initializeTreeNavigation({
			root: homeDetails,
			scrollContainer: treeScroll,
			onChange: requestRender,
			signal: abortController.signal,
		});
	}
	const contentResizeObserver =
		typeof ResizeObserver !== 'undefined' ? new ResizeObserver(handleResize) : null;
	for (const content of contentPanes) {
		contentResizeObserver?.observe(content);
		for (const child of content.children) contentResizeObserver?.observe(child);
	}

	scroller.addEventListener('scroll', requestRender, {
		passive: true,
		signal: abortController.signal,
	});
	scroller.addEventListener('pointerdown', (event) => {
		if (!(event.target instanceof Element)) return;
		if (!event.target.closest('[data-project-card]')) return;
		if (event.target.closest('a, button, input, select, textarea, summary')) return;
		// A decorative card must not focus its scrollable ancestor on pointer press.
		// Vertical gestures are handled by section-scroll; horizontal panning stays native.
		event.preventDefault();
	}, { signal: abortController.signal });
	for (const content of contentPanes) {
		content.addEventListener('scroll', requestRender, { passive: true, signal: abortController.signal });
	}
	window.addEventListener('resize', handleResize, { signal: abortController.signal });
	reducedMotion.addEventListener('change', requestRender, { signal: abortController.signal });
	mobileViewport.addEventListener('change', () => {
		updatePaneFocusability();
		handleResize();
	}, { signal: abortController.signal });

	nameAction?.addEventListener(
		'click',
		async () => {
			const inDetails = scroller.scrollTop / Math.max(detailsTop, 1) >= 0.5;
			if (!inDetails) {
				await clipboard?.copy();
				return;
			}

			const home = document.getElementById('home');
			if (home) sectionScroll.navigateTo(home);
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
			sectionScroll.navigateTo(target);
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
			sectionScroll.navigateTo(target);
		},
		{ capture: true, signal: abortController.signal },
	);
	window.addEventListener(
		'hashchange',
		() => {
			const target = getFragmentTarget(location.hash);
			if (target) sectionScroll.navigateTo(target);
		},
		{ signal: abortController.signal },
	);

	scrollCue?.addEventListener(
		'click',
		(event) => {
			event.preventDefault();
			sectionScroll.scrollBy(scroller.clientHeight * 0.8);
		},
		{ signal: abortController.signal },
	);

	document.addEventListener(
		'astro:before-swap',
		() => {
			abortController.abort();
			treeNavigation?.disconnect();
			contentResizeObserver?.disconnect();
			clipboard?.dispose();
			window.cancelAnimationFrame(frameId);
			delete scroller.dataset.interactionsReady;
			for (const { element, tabindex } of paneFocusTargets) {
				if (tabindex === null) element.removeAttribute('tabindex');
				else element.setAttribute('tabindex', tabindex);
			}
		},
		{ once: true },
	);

	updatePaneFocusability();
	measure();
	const initialTarget = getFragmentTarget(location.hash);
	if (initialTarget) sectionScroll.navigateTo(initialTarget);
	requestRender();
};

initializePageScroll();
document.addEventListener('astro:page-load', initializePageScroll);
