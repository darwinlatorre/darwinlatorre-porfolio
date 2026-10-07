export const portfolioSections = [
	{ id: 'home', label: 'Home' },
	{ id: 'about', label: 'About' },
	{ id: 'projects', label: 'Projects' },
	{ id: 'experience', label: 'Experience' },
	{ id: 'services', label: 'Services' },
	{ id: 'certificates', label: 'Certificates' },
] as const;

export type PortfolioSection = (typeof portfolioSections)[number]['id'];

export const isPortfolioSection = (value: string): value is PortfolioSection =>
	portfolioSections.some(({ id }) => id === value);
