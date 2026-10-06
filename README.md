# Darwin Latorre Portfolio

Personal portfolio for Darwin Latorre, a DevOps and Backend Engineer. Built with Astro, it presents professional experience, selected projects, services, and certifications through a terminal-inspired interface.

**Live site:** [darwinlatorre.com](https://darwinlatorre.com)

## Tech Stack

- **Site:** [Astro](https://astro.build/), TypeScript, and CSS.
- **Icons:** [Lucide](https://lucide.dev/) and [Simple Icons](https://simpleicons.org/).
- **Quality checks:** ESLint and Astro Check.
- **Deployment:** Vercel, with Docker and Docker Compose for local production previews.

## Requirements

- Node.js 22.12 or later
- npm (use the committed `package-lock.json`).

## Local Development

Install dependencies and start the development server:

```sh
npm ci
npm run dev
```

The site will be available at `http://localhost:4321`.

## Verification and Production Preview

Run the independent checks before publishing:

```sh
npm run lint
npm run check
npm run build
```

Then use `npm run preview` to serve the built site locally. The build command does not run lint or type checking automatically.

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
  data/         Profile, projects, services, and certificate content
  layouts/      Shared Astro page layout
  pages/        Site entry points
  scripts/      Terminal, navigation, and scroll interactions
  styles/       Global styles and design tokens
  types/        Shared TypeScript types
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
- Production is available at [darwinlatorre.com](https://darwinlatorre.com).
