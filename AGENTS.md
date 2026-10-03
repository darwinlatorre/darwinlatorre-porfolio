# Repository guidance

## Commands and tooling
- Use npm with `package-lock.json`; `npm ci` is the reproducible install used by Docker. `package.json` requires Node >=22.12.0; Docker builds with Node 24.
- Verification commands are separate: `npm run lint`, `npm run check` (Astro/TypeScript diagnostics), and `npm run build`. The build script does not run lint or type checking. There is no configured test runner or formatter.
- For focused linting, use `npx eslint src/path/to/file.astro` (also supports `.ts`). `npm run lint:fix` applies fixes across the project.
- `npm run dev` serves on port 4321; `npm run build` must precede `npm run preview`. `docker compose up --build` serves the built static site through nginx at port 4321.
- `dist/` and `.astro/` are generated and ignored; do not hand-edit them. TypeScript uses Astro's strict config and includes generated `.astro/types.d.ts`.
- `.editorconfig` specifies tabs (width 2), with spaces for JSON/JSONC/YAML.

## Agent tooling
- OpenCode loads the project skills from `.agents/skills/` via `opencode.json`. Setup instructions are in README's Agent tooling section.
- Graphify is installed in `.venv/` from `requirements-graphify.txt` (the official Python package is `graphifyy`). Use `npm run graphify -- <command>`; for skill blocks needing Python use `.venv/bin/python`, or activate `.venv` first. Do not use system Python to reinstall it.
- `npm run graphify:build` creates/refreshes the local code-only graph and HTML/report in ignored `graphify-out/`, without an API key. Query with `npm run graphify -- query "<question>"`; confirm graph results against source, especially markup/styles that AST extraction does not fully capture.

## App wiring and change hazards
- This is a static Astro site with a single page, `src/pages/index.astro`, and no server adapter. `BaseLayout.astro` imports global styles/design tokens and includes Vercel Analytics and Speed Insights.
- The page orders Home → About → Experience → Services → Certificates. Home contains two screens (`Hero` and `HomeDetails`), so section count is not screen count.
- The body has `overflow: hidden`; scrolling happens in `[data-page-scroll]`, not the window. `src/scripts/page-scroll.ts` coordinates scroll-driven reveals, nested content scrolling, fragment navigation, keyboard navigation, and shared shell elements. Review it when changing section order, heights, or scroll behavior.
- Component `data-*` attributes and section/fragment IDs are behavior hooks consumed by the scripts. Update markup and selectors together; navigation links are maintained separately in `components/home/FileTree.astro` and `components/shell/MenuButton.astro`. Certificate fragment links in FileTree must match IDs in `components/certificates/Certificates.astro`.
- Despite its name, `src/scripts/about-interactions.ts` initializes every `[data-terminal-root]` (About, Experience, Certificates), sharing command responses and technology-dialog behavior. Changes there affect all three terminals.
- Interaction initializers guard with `data-interactions-ready` and clean up listeners on `astro:before-swap` using AbortController; preserve those lifecycle guards when extending them.
- For scroll/UI changes, check desktop and mobile (the scroll script switches at 48rem), keyboard/fragment navigation, nested scrolling, and reduced-motion behavior in the browser; the configured checks do not exercise those interactions.
