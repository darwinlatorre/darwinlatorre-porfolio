// Soft "bubble" cues synthesized with Web Audio: no audio files to load.
// They only play right after a user action (opening or closing something), and can be muted
// with the `sound off` terminal command.

type Cue = 'open' | 'close';

const storageKey = 'portfolio-sound';
// A smooth pitch glide (Hz): rising for the "plop" on open, falling for the "blop" on close.
const glides: Record<Cue, [number, number]> = {
	open: [320, 880],
	close: [660, 240],
};
const duration = 0.09;
// Kept very low on purpose: a subtle cue, never louder than the page deserves.
const volume = 0.018;

let context: AudioContext | null = null;

export const isSoundEnabled = () => {
	try {
		return localStorage.getItem(storageKey) !== 'off';
	} catch {
		return true;
	}
};

export const setSoundEnabled = (enabled: boolean) => {
	try {
		localStorage.setItem(storageKey, enabled ? 'on' : 'off');
	} catch {
		// Storage unavailable: the choice lasts for this visit only.
	}
};

export const playCue = (cue: Cue) => {
	if (!isSoundEnabled() || typeof AudioContext === 'undefined') return;
	context ??= new AudioContext();
	// Mobile browsers start the context suspended until a gesture; every cue follows one.
	if (context.state === 'suspended') void context.resume();

	const start = context.currentTime;
	const end = start + duration;
	const [from, to] = glides[cue];
	const oscillator = context.createOscillator();
	const gain = context.createGain();

	// A sine glide with a fast attack and quick decay reads as a water drop, not a beep.
	oscillator.type = 'sine';
	oscillator.frequency.setValueAtTime(from, start);
	oscillator.frequency.exponentialRampToValueAtTime(to, end);
	gain.gain.setValueAtTime(0.0001, start);
	gain.gain.exponentialRampToValueAtTime(volume, start + 0.008);
	gain.gain.exponentialRampToValueAtTime(0.0001, end + 0.03);

	oscillator.connect(gain).connect(context.destination);
	oscillator.start(start);
	oscillator.stop(end + 0.05);
};
