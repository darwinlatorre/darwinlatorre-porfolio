export const profile = {
	name: 'Darwin Latorre',
	handle: 'Dark',
	role: 'DevOps & Backend Developer',
	email: 'darwilestib12@gmail.com',
	description:
		"I'm a DevOps and Backend Engineer focused on building reliable cloud infrastructure and scalable applications. My experience spans AWS, GCP, Kubernetes, Terraform, CI/CD, and Spring Boot, bridging development and operations to deliver efficient production systems.",
	experienceYears: '3+',
	technologiesUsed: '16+',
	cvHref: '/Darwin_Latorre_CV_English.pdf',
	githubHref: 'https://github.com/darwinlatorre',
} as const;

export const socialLinks = [
	{ label: 'LinkedIn', href: 'https://www.linkedin.com/in/darwinlatorre/' },
	{ label: 'GitHub', href: profile.githubHref },
	{ label: 'X', href: 'https://x.com/latorre_darwin' },
] as const;

export const projects = [
	{
		id: 'project-z3ntry',
		name: 'z3ntry',
		description: 'Sitio de Z3nTry sobre ciberseguridad, desarrollo y diseño.',
		href: 'https://www.z3ntry.com/',
		repository: 'https://github.com/Z3nTry-0/z3ntry',
		preview: 'https://www.z3ntry.com/',
	},
	{
		id: 'project-auth-service',
		name: 'auth-service-custom',
		description: 'Servicio de autenticación con Spring Boot y JWT: gestión de usuarios, roles, sesiones, verificación de correo y recuperación de contraseñas.',
		href: 'https://github.com/darwinlatorre/auth-service-custom-implementation',
		repository: null,
		preview: null,
	},
	{
		id: 'project-portfolio',
		name: 'darwinlatorre_',
		description: 'Portafolio personal de DevOps y desarrollo backend, con experiencia profesional, proyectos y certificaciones en una interfaz de terminal interactiva.',
		href: 'https://www.darwinlatorre.com/',
		repository: 'https://github.com/darwinlatorre/darwinlatorre-porfolio',
		preview: 'https://www.darwinlatorre.com/',
	},
] as const;

export const experiences = [
	{
		role: 'Java Developer',
		company: 'Freelance',
		location: 'darwinlatorre',
		start: '2026-06',
		end: '2026-07',
		startLabel: 'Jun 2026',
		endLabel: 'Currently',
		highlights: [
			'Performed adjustments and maintenance on the backend of an e-commerce platform developed with Java and Spring Boot.',
			'Implemented adjustments, bug fixes, and deployments on GCP using Cloud Run, Cloud SQL, Artifact Registry, and Secret Manager.',
		],
	},
	{
		role: 'DevOps Engineer',
		company: 'Asmet Salud EPS',
		location: null,
		start: '2025-01',
		end: '2026-03',
		startLabel: 'Jan 2025',
		endLabel: 'Mar 2026',
		highlights: [
			'Implemented CI/CD pipelines with Jenkins and GitLab for deploying Spring Boot microservices on AWS using EKS.',
			'Managed on-premises Kubernetes clusters running production Spring Boot microservices, monitored with Prometheus and Grafana.',
			'Provisioned and maintained AWS infrastructure using Terraform and Terragrunt, including EKS, IAM, Secrets Manager, VPC, and RDS.',
			'Collaborated with development teams using GitLab, Jira, and Agile methodologies.',
		],
	},
	{
		role: 'IT Infrastructure Professional',
		company: 'Asmet Salud EPS',
		location: null,
		start: '2024-06',
		end: '2024-12',
		startLabel: 'Jun 2024',
		endLabel: 'Dec 2024',
		highlights: [
			'Developed a password management system with high availability (HA) and a disaster recovery plan (DRP).',
			'Managed AWS and on-premises infrastructure, Active Directory, networks, backups, and database backups.',
			'Migrated JBoss and WebLogic applications from Java 7 to Java 11, including servers and code.',
		],
	},
] as const;

export const experienceSummary =
	'AWS, GCP, Kubernetes, Terraform, Jenkins, Spring Boot, GitLab CI/CD';

export const services = [
	{
		title: 'Backend Development',
		description:
			'Desarrollo, mantenimiento y evolución de aplicaciones backend con Java y Spring Boot.',
	},
	{
		title: 'Cloud & DevOps',
		description: 'Implementación y mejora de infraestructura y procesos de despliegue en la nube.',
	},
	{
		title: 'CRM & Email Configuration',
		description:
			'Configuration and customization of Zoho CRM, customer management, automations, email setup, notifications, and integrations with external services.',
	},
	{
		title: 'Monitoring & Observability',
		description: 'Configuración de monitoreo para aplicaciones e infraestructura.',
	},
] as const;

export const certificates = [
	{
		id: 'certificate-aws',
		title: 'AWS Certified Cloud Practitioner',
		provider: 'coming soon',
		href: null,
	},
	{
		id: 'certificate-terraform',
		title: 'HashiCorp Terraform Associate',
		provider: 'coming soon',
		href: null,
	},
	{
		id: 'certificate-1',
		title: 'Angular: De cero a experto',
		provider: 'Udemy',
		href: 'https://www.udemy.com/certificate/UC-b2abc958-5ab7-4ca7-b515-f8031e4e84f4/',
	},
	{
		id: 'certificate-2',
		title: 'Unlocking Information Security',
		provider: 'edX / IsraelX',
		href: 'https://courses.edx.org/certificates/e85f29f5874a422cab5a54a637eee525',
	},
	{
		id: 'certificate-3',
		title: 'Curso de Patrones de Diseño Creacionales en JavaScript',
		provider: 'Platzi',
		href:
			'https://platzi.com/p/darwinlatorre_/curso/6933-patrones-diseno-creacionales/diploma/detalle/',
	},
	{
		id: 'certificate-4',
		title: 'Curso de API REST con Javascript: Fundamentos',
		provider: 'Platzi',
		href: 'https://platzi.com/p/darwinlatorre_/curso/2985-api/diploma/detalle/',
	},
] as const;
