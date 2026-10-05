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

## Agent tooling

The project-local Graphify skill is installed in `.agents/skills/` and loaded by OpenCode through `opencode.json`. Restart OpenCode after installing or updating skills.

### Graphify

Requires Python 3.10+ and [uv](https://docs.astral.sh/uv/getting-started/installation/). Install the pinned official `graphifyy` package in an isolated project environment:

```sh
uv venv .venv
uv pip install --python .venv/bin/python -r requirements-graphify.txt
npm run graphify:build
npm run graphify -- query "initializePageScroll"
```

`graphify:build` indexes code locally without an API key, then generates `graphify-out/graph.json`, `GRAPH_REPORT.md`, and `graph.html`. Re-run it after code changes. `.graphifyignore` excludes agent tooling and lockfiles; `.gitignore` is also respected. Documentation/media semantic extraction through the Graphify skill is a separate workflow.

For skill examples using bare `graphify` or Python commands, activate the environment with `source .venv/bin/activate` first, or use `.venv/bin/graphify` and `.venv/bin/python` explicitly.

## Branches and Deployment

- `dev` is the active development branch.
- `main` contains production-ready changes.
- Vercel deploys the production site from `main` and creates previews for pull requests.
