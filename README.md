# Darwin Latorre Portfolio

Personal portfolio for Darwin Latorre, a DevOps and Backend Engineer. Built with Astro, it presents professional experience, selected projects and certifications through a terminal-inspired interface.

**Live site:** [darwinlatorre.com](https://darwinlatorre.com)

## Tech Stack

- **Site:** [Astro](https://astro.build/), TypeScript, and CSS.
- **Icons:** [Lucide](https://lucide.dev/) and [Simple Icons](https://simpleicons.org/).
- **Quality checks:** ESLint and Astro Check.
- **Local production previews:** Docker and Docker Compose.

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
  data/         Profile, projects, experience, certificates, navigation, and themes
  layouts/      Shared Astro page layout
  pages/        Site entry points
  scripts/      Terminal, navigation, scroll, theme, and sound interactions
  styles/       Global styles, design tokens, and theme palettes
public/         Static assets and downloadable CV
```

## Maintaining the Code

- `src/data/portfolio.ts` is the shared source for profile, project, experience, and certificate content.
- `src/data/navigation.ts` defines the section IDs and labels used by the menu, terminal commands, and scroll cue. The page markup in `src/pages/index.astro` must follow that order; Home contains two screens.
- `src/scripts/page-scroll.ts` controls reveals and shared UI; `home-snap.ts` snaps between the two Home screens and the top of About, and everything after that scrolls freely. Scrolling happens inside `[data-page-scroll]`.
- `src/scripts/command-typing.ts` types each section's prompt command when it scrolls into view; the section output prints after it.
- The terminal (`src/scripts/terminal-interactions.ts`) is global: bottom left on desktop from About onward, and inside the swipe drawer (`src/scripts/drawer.ts`) on phones. Run `help` to list commands, including `theme` and `sound`.
- Themes live in `src/data/themes.ts` and as `[data-theme]` palettes in `src/styles/variables.css`; the choice is saved in `localStorage` and applied before first paint in `BaseLayout.astro`.
- `src/scripts/dialog.ts` shares dialog focus restoration and cleanup between the CV and technology dialogs.
- TypeScript checks unused locals and parameters. For scroll or dialog changes, also verify mobile and desktop, keyboard navigation, fragment links, and reduced motion in a browser.

## Branches and Deployment

- `dev` is the active development branch.
- `main` contains production-ready changes.
- Production is available at [darwinlatorre.com](https://darwinlatorre.com).
