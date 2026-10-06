import {
	certificates,
	experiences,
	experienceSummary,
	profile,
	services,
	socialLinks,
} from '../data/portfolio';
import type { PortfolioSection, TerminalContext } from '../types/terminal';

type ShowTarget = PortfolioSection;

type TerminalResult =
	| { type: 'text'; text: string }
	| { type: 'list'; title?: string; items: string[] }
	| {
			type: 'links';
			title?: string;
			links: Array<{ label: string; href: string; external?: boolean }>;
	  };

type TerminalAction =
	| { type: 'navigate'; target: PortfolioSection }
	| { type: 'open'; href: string }
	| { type: 'email'; href: string }
	| { type: 'technologies' };

interface CommandExecution {
	result?: TerminalResult;
	action?: TerminalAction;
}

interface TerminalCommand {
	name: string;
	usage: string;
	description: string;
	execute: (args: string[], context: TerminalContext) => CommandExecution;
}

declare global {
	interface DocumentEventMap {
		'portfolio:navigate': CustomEvent<{ target: PortfolioSection }>;
		'portfolio:open-technologies': CustomEvent;
	}
}

const internalSections: PortfolioSection[] = [
	'home',
	'about',
	'projects',
	'experience',
	'services',
	'certificates',
];
const showTargets: ShowTarget[] = internalSections;
const commandHistory: string[] = [];

const text = (value: string): TerminalResult => ({ type: 'text', text: value });

const getShowResult = (target: ShowTarget): TerminalResult => {
	switch (target) {
		case 'home':
			return {
				type: 'list',
				title: `${profile.handle} — ${profile.role}`,
				items: ['Explore the portfolio, get in touch, or open the CV.'],
			};
		case 'about':
			return {
				type: 'list',
				title: profile.description,
				items: [
					`experience_years: ${profile.experienceYears}`,
					`technologies_used: ${profile.technologiesUsed}`,
					`links: ${socialLinks.map(({ label }) => label).join(' | ')}`,
				],
			};
		case 'experience':
			return {
				type: 'list',
				title: 'Professional experience',
				items: [
					...experiences.map(
						(item) =>
							`[${item.startLabel} - ${item.endLabel}] ${item.role} @ ${item.company}${item.location ? ` / ${item.location}` : ''}`,
					),
					`Summary: ${experienceSummary}`,
				],
			};
		case 'services':
			return {
				type: 'list',
				title: 'Services',
				items: services.map((service) => `${service.title}: ${service.description}`),
			};
		case 'certificates':
			return {
				type: 'list',
				title: 'Certificates',
				items: certificates.map(
					(certificate) =>
						`${certificate.title} [${certificate.provider}] — ${certificate.href ? 'available' : 'upcoming'}`,
				),
			};
		case 'projects':
			return {
				type: 'links',
				title: 'Featured projects',
				links: [{ label: 'Explore projects', href: '#projects' }],
			};
	}
};

const commands: Record<string, TerminalCommand> = {
	help: {
		name: 'help',
		usage: 'help',
		description: 'Show available commands.',
		execute: () => ({
			result: {
				type: 'list',
				title: 'Available commands',
				items: Object.values(commands).map(
					(command) => `${command.usage} — ${command.description}`,
				),
			},
		}),
	},
	ls: {
		name: 'ls',
		usage: 'ls',
		description: 'List portfolio sections.',
		execute: () => ({
			result: {
				type: 'list',
				items: internalSections.map((section) => `${section}/`),
			},
		}),
	},
	pwd: {
		name: 'pwd',
		usage: 'pwd',
		description: 'Show the current section.',
		execute: (_args, context) => ({ result: text(`/portfolio/${context}`) }),
	},
	go: {
		name: 'go',
		usage: 'go <section>',
		description: 'Navigate to an internal section.',
		execute: ([target, ...extra]) => {
			if (!target || extra.length > 0 || !internalSections.includes(target as PortfolioSection)) {
				return {
					result: text(`usage: go <${internalSections.join('|')}>`),
				};
			}

			return {
				action: { type: 'navigate', target: target as PortfolioSection },
			};
		},
	},
	show: {
		name: 'show',
		usage: 'show [section]',
		description: 'Show a portfolio summary.',
		execute: ([target, ...extra], context) => {
			const resolvedTarget = target ?? context;
			if (extra.length > 0 || !showTargets.includes(resolvedTarget as ShowTarget)) {
				return {
					result: text(
						`usage: show [${internalSections.join('|')}]`,
					),
				};
			}

			return { result: getShowResult(resolvedTarget as ShowTarget) };
		},
	},
	whoami: {
		name: 'whoami',
		usage: 'whoami',
		description: 'Show the professional profile.',
		execute: () => ({ result: text(`${profile.name} — ${profile.role}. ${profile.description}`) }),
	},
	skills: {
		name: 'skills',
		usage: 'skills',
		description: 'Open the technology list.',
		execute: () => ({ action: { type: 'technologies' } }),
	},
	contact: {
		name: 'contact',
		usage: 'contact',
		description: 'Show email and social profiles.',
		execute: () => ({
			result: {
				type: 'links',
				title: 'Contact Darwin',
				links: [
					{ label: profile.email, href: `mailto:${profile.email}` },
					...socialLinks.map((link) => ({ ...link, external: true })),
				],
			},
		}),
	},
	email: {
		name: 'email',
		usage: 'email',
		description: 'Open a new email.',
		execute: () => ({
			result: text(`Opening mail to ${profile.email}...`),
			action: { type: 'email', href: `mailto:${profile.email}` },
		}),
	},
	cv: {
		name: 'cv',
		usage: 'cv',
		description: 'Open the CV.',
		execute: () => ({
			result: text('Opening CV...'),
			action: { type: 'open', href: profile.cvHref },
		}),
	},
	projects: {
		name: 'projects',
		usage: 'projects',
		description: 'Go to featured projects.',
		execute: () => ({
			action: { type: 'navigate', target: 'projects' },
		}),
	},
	history: {
		name: 'history',
		usage: 'history',
		description: 'Show commands used in this session.',
		execute: () => ({
			result: {
				type: 'list',
				title: 'Command history',
				items: commandHistory.map((command, index) => `${index + 1}  ${command}`),
			},
		}),
	},
	clear: {
		name: 'clear',
		usage: 'clear',
		description: 'Clear the current terminal output.',
		execute: () => ({}),
	},
};

const renderResult = (container: HTMLElement, result?: TerminalResult) => {
	container.replaceChildren();
	container.hidden = !result;
	if (!result) return;

	if (result.type === 'text') {
		const paragraph = document.createElement('p');
		paragraph.textContent = result.text;
		container.append(paragraph);
		return;
	}

	if (result.title) {
		const title = document.createElement('p');
		title.textContent = result.title;
		container.append(title);
	}

	const list = document.createElement('ul');
	if (result.type === 'list') {
		for (const item of result.items) {
			const listItem = document.createElement('li');
			listItem.textContent = item;
			list.append(listItem);
		}
	} else {
		for (const link of result.links) {
			const listItem = document.createElement('li');
			const anchor = document.createElement('a');
			anchor.textContent = link.label;
			anchor.href = link.href;
			if (link.external) {
				anchor.target = '_blank';
				anchor.rel = 'noreferrer';
			}
			listItem.append(anchor);
			list.append(listItem);
		}
	}
	container.append(list);
};

const runAction = (action?: TerminalAction) => {
	if (!action) return;

	switch (action.type) {
		case 'navigate':
			document.dispatchEvent(
				new CustomEvent('portfolio:navigate', { detail: { target: action.target } }),
			);
			break;
		case 'open':
			window.open(action.href, '_blank', 'noopener,noreferrer');
			break;
		case 'email':
			window.location.href = action.href;
			break;
		case 'technologies':
			document.dispatchEvent(new CustomEvent('portfolio:open-technologies'));
			break;
	}
};

const initializeTerminal = (root: HTMLElement) => {
	if (root.dataset.interactionsReady === 'true') return;

	const context = root.dataset.terminalContext as TerminalContext | undefined;
	const form = root.querySelector<HTMLFormElement>('[data-terminal-form]');
	const input = root.querySelector<HTMLInputElement>('[data-terminal-input]');
	const mirror = root.querySelector<HTMLElement>('[data-terminal-mirror]');
	const response = root.querySelector<HTMLElement>('[data-terminal-response]');
	const scrollContainer = root.closest<HTMLElement>('[data-terminal-scroll]');
	if (!context || !form || !input || !mirror || !response) return;

	root.dataset.interactionsReady = 'true';
	const abortController = new AbortController();
	const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
	let focusTimer = 0;
	let historyIndex = commandHistory.length;
	let draft = '';

	const syncCursor = () => {
		mirror.textContent = input.value;
	};
	const setInputValue = (value: string) => {
		input.value = value;
		syncCursor();
	};

	form.addEventListener(
		'submit',
		(event) => {
			event.preventDefault();
			const rawCommand = input.value.trim().replace(/\s+/g, ' ');
			setInputValue('');
			if (!rawCommand) return;

			commandHistory.push(rawCommand);
			historyIndex = commandHistory.length;
			draft = '';
			const [commandName, ...args] = rawCommand.toLowerCase().split(' ');
			const command = commands[commandName];
			const execution = command
				? command.execute(args, context)
				: { result: text(`command not found: ${commandName}. Use "help" to list commands.`) };

			renderResult(response, execution.result);
			if (execution.action?.type === 'navigate') {
				window.clearTimeout(focusTimer);
				input.blur();
			}
			runAction(execution.action);
		},
		{ signal: abortController.signal },
	);

	input.addEventListener(
		'keydown',
		(event) => {
			if (event.key === 'Escape') {
				setInputValue('');
				historyIndex = commandHistory.length;
				draft = '';
				return;
			}

			if (event.key !== 'ArrowUp' && event.key !== 'ArrowDown') return;
			event.preventDefault();
			if (event.key === 'ArrowUp' && commandHistory.length > 0) {
				if (historyIndex === commandHistory.length) draft = input.value;
				historyIndex = Math.max(0, historyIndex - 1);
				setInputValue(commandHistory[historyIndex]);
			}
			if (event.key === 'ArrowDown' && historyIndex < commandHistory.length) {
				historyIndex += 1;
				setInputValue(
					historyIndex === commandHistory.length ? draft : commandHistory[historyIndex],
				);
			}
		},
		{ signal: abortController.signal },
	);

	input.addEventListener('input', syncCursor, { signal: abortController.signal });
	input.addEventListener(
		'focus',
		() => {
			window.clearTimeout(focusTimer);
			focusTimer = window.setTimeout(() => {
				if (!scrollContainer) return;
				const inputTop =
					input.getBoundingClientRect().top -
					scrollContainer.getBoundingClientRect().top +
					scrollContainer.scrollTop;
				scrollContainer.scrollTo({
					top: Math.max(0, inputTop - scrollContainer.clientHeight * 0.45),
					behavior: reducedMotion.matches ? 'auto' : 'smooth',
				});
			}, 250);
		},
		{ signal: abortController.signal },
	);
	input.addEventListener('blur', () => window.clearTimeout(focusTimer), {
		signal: abortController.signal,
	});

	document.addEventListener(
		'astro:before-swap',
		() => {
			abortController.abort();
			window.clearTimeout(focusTimer);
			delete root.dataset.interactionsReady;
		},
		{ once: true },
	);
};

const initializeTechnologyDialog = () => {
	const dialog = document.querySelector<HTMLDialogElement>('[data-technologies-dialog]');
	if (!dialog || dialog.dataset.interactionsReady === 'true') return;

	dialog.dataset.interactionsReady = 'true';
	const closeButton = dialog.querySelector<HTMLButtonElement>('[data-technologies-close]');
	const abortController = new AbortController();
	let previousFocus: HTMLElement | null = null;

	const open = () => {
		if (dialog.open) return;
		previousFocus = document.activeElement instanceof HTMLElement ? document.activeElement : null;
		dialog.showModal();
	};
	const close = () => dialog.close();

	document.addEventListener('portfolio:open-technologies', open, {
		signal: abortController.signal,
	});
	document.querySelectorAll<HTMLElement>('[data-technologies-open]').forEach((trigger) => {
		trigger.addEventListener('click', open, { signal: abortController.signal });
	});
	closeButton?.addEventListener('click', close, { signal: abortController.signal });
	dialog.addEventListener(
		'click',
		(event) => {
			if (event.target === dialog) close();
		},
		{ signal: abortController.signal },
	);
	dialog.addEventListener(
		'close',
		() => {
			previousFocus?.focus();
			previousFocus = null;
		},
		{ signal: abortController.signal },
	);

	document.addEventListener(
		'astro:before-swap',
		() => {
			previousFocus = null;
			if (dialog.open) dialog.close();
			abortController.abort();
			delete dialog.dataset.interactionsReady;
		},
		{ once: true },
	);
};

const initializeTerminalInteractions = () => {
	document.querySelectorAll<HTMLElement>('[data-terminal-root]').forEach(initializeTerminal);
	initializeTechnologyDialog();
};

initializeTerminalInteractions();
document.addEventListener('astro:page-load', initializeTerminalInteractions);
