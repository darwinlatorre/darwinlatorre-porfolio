# Darwin Latorre Portfolio

Personal portfolio for a DevOps and Backend Developer, built with Astro and presented as an interactive terminal experience.

**Live site:** [darwinlatorre.vercel.app](https://darwinlatorre.vercel.app)

## Features

- Full-screen navigation with scroll snapping across Home, About, Experience, and Certificates.
- Interactive terminal prompts with command responses and synchronized cursors.
- Professional experience covering DevOps, cloud infrastructure, Java, and Spring Boot.
- External certificate verification links and upcoming certification status.
- Responsive layouts with mobile accordions and sequential internal scrolling.
- Keyboard navigation, reduced-motion support, accessible focus states, and semantic markup.
- Vercel Analytics and Speed Insights integration.

## Tech Stack

- [Astro](https://astro.build/)
- TypeScript
- CSS
- [Lucide](https://lucide.dev/) and [Simple Icons](https://simpleicons.org/)
- ESLint and Astro Check
- Docker and Docker Compose
- Vercel

## Requirements

- Node.js 22.12 or later
- npm

## Local Development

Install dependencies and start the development server:

```sh
npm install
npm run dev
```

The site will be available at `http://localhost:4321`.

## Available Commands

| Command | Description |
| --- | --- |
| `npm run dev` | Start the Astro development server. |
| `npm run lint` | Run ESLint across the project. |
| `npm run check` | Run Astro and TypeScript diagnostics. |
| `npm run build` | Create the production build in `dist/`. |
| `npm run preview` | Preview the production build locally. |

## Docker

Build and run the production site at `http://localhost:4321`:

```sh
docker compose up --build
```

Stop and remove the container:

```sh
docker compose down
```

## Project Structure

```text
src/
  components/   UI organized by portfolio section
  layouts/      Shared Astro page layout
  pages/        Site entry points
  scripts/      Terminal, navigation, and scroll interactions
  styles/       Global styles and design tokens
public/         Static assets and downloadable CV
```

## Branches and Deployment

- `dev` is the active development branch.
- `main` contains production-ready changes.
- Vercel deploys the production site from `main` and creates previews for pull requests.
