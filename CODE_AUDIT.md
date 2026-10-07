# Code audit

Reviewed on 2026-10-06, starting from `dev` commit `f0707a0`.

## Scope and method

Reviewed application entry points, all source components and scripts, content data, TypeScript types, scoped/global CSS, declared npm dependencies, public assets, and build configuration. Import relationships were checked against the source, and static findings were checked against the built site's DOM and browser interactions.

Knip 6.40.0 was run without adding it as a project dependency:

```sh
npm exec --yes --package=knip@6.40.0 -- knip --include files,dependencies,unlisted,exports,types --no-progress
```

It reported no unused source files, declared dependencies, exports, or types, and no unlisted dependencies. This checks import usage; it does not prove that every execution path or CSS declaration is necessary.

## Usage inventory

| Area | Verified use |
| --- | --- |
| Astro components | Reachable from `src/pages/index.astro`, `BaseLayout.astro`, and their child components. `Hero.astro` intentionally supplies the first snap screen behind the shared name. |
| Page and section scrolling | Loaded by the page; coordinate reveals, nested panes, fragments, wheel/keyboard navigation, and touch gestures. |
| Tree navigation and clipboard | Called by the page-scroll initializer. |
| Terminal interactions | Loaded by the page and initialize the four terminal roots and technology-dialog triggers. |
| CV interactions | Loaded by the page; lazily load the PDF and open its desktop dialog. |
| Menu interactions | Imported by `MenuButton.astro`; manage open/closed state and cleanup. |
| Shared dialog controller | Used by CV and technology interactions. |
| Portfolio/navigation data and types | Used by rendered content, structured data, menus, scroll cues, and validated terminal commands. |
| npm dependencies | Astro builds the site; Lucide and Simple Icons render icons; Vercel packages supply analytics/performance integrations; development dependencies supply linting and diagnostics. |
| Public runtime assets | Favicon, PNG social card, both project previews, and the CV PDF have active references and return HTTP 200. |

`public/social-card.svg` has no direct runtime reference: the layout uses `social-card.png`. The SVG is retained as the editable artwork corresponding to that image.

The CSS review covered the built stylesheet rules, responsive variants, dynamic state selectors, and custom-property references. The only selectors without matches on initial load targeted terminal response paragraphs, lists, and links; those elements were confirmed after executing `contact`. No unreferenced stylesheet custom properties were found.

## Refactorings

- Removed the duplicate experience dataset and summary from `Experience.astro`; the component and terminal now use `src/data/portfolio.ts`.
- Reused profile/CV/social-link data across Home, dialogs, Projects, and the footer. FileTree's certificate labels and fragment targets now come from certificate data.
- Centralized section identifiers, labels, their TypeScript union, and runtime validation in `src/data/navigation.ts`.
- Replaced repeated scroll-state, scroll-cue, resize-observer, and scroll-listener blocks with shared section/pane processing. Navigation updates `inert` synchronously before restoring keyboard focus, and cancels any already-queued render frame.
- Shared modal behavior in `src/scripts/dialog.ts`, including focus restoration without moving the page and cleanup during page swaps.
- Extracted menu interactions into `src/scripts/menu.ts`, with idempotent initialization, delegated link handling, and listener cleanup.
- Added consistent reinitialization on `astro:page-load` and disconnected the Home reveal observer during cleanup.
- Consolidated duplicate mobile/touch project styles and reused the existing Simple Icons GitHub path.
- Enabled `noUnusedLocals` and `noUnusedParameters`; excluded generated graph output and the Python environment from ESLint.

## Confirmed unused/redundant code removed

- The command registry's `name` properties, which were never read.
- `ShowTarget` and `showTargets`, aliases of existing section types/data.
- The menu's `external` flags and external-link branches, because every menu item is internal.
- `data-cv-download` and `data-cv-external`, which had no script or style consumers.
- Duplicate CSS declarations in HomeDetails, AuthPreview, Experience, and mobile/touch Projects rules.

## Behavioral defects corrected

- `constructor` and `__proto__` previously resolved inherited object properties and crashed command execution. Command lookup now checks own properties.
- An unfocused terminal retained an outdated position in the shared command history. Focusing a terminal now synchronizes its history index.
- Wheel input over the menu previously navigated the main page and closed the menu. Wheel and keyboard input inside the panel now retain native menu scrolling.
- A clipboard promise resolving after cleanup could update outgoing UI and schedule feedback timers. Disposed clipboard controllers now ignore those results.
- Reduced-motion handling now covers the menu trigger's entrance animation and the CV tool's pseudo-element transition.

## Verification results

- `npm run lint`: passed.
- `npm run check`: passed, with zero errors, warnings, or hints.
- `npm run build`: passed.
- `git diff --check`: passed.
- Knip usage checks: passed.
- Browser comparison against pre-refactor snapshots: section content, pane dimensions, scroll heights, and project-card bounds matched at 320×640, 390×844, 768×844, 1440×900, and 1920×1080.
- Touch checks: fresh swipes required at internal scroll edges in both directions; inertia stays inside the current section; transitions remain smooth; project cards stay centered.
- Interaction checks: valid/invalid commands, shared history and drafts, clear output, tree toggles, modal open/close and focus restoration, idempotent initialization, and cleanup/reinitialization passed without page errors.
- Navigation checks: deep project fragments, plain mobile CV links, breakpoint-dependent focusability, short-viewport menu scrolling, and reduced-motion keyboard navigation passed.
- Document checks: no duplicate IDs or missing internal fragment targets; canonical URL and JSON-LD were valid; local runtime assets returned HTTP 200.

Browser checks used temporary Playwright scripts under `/tmp/opencode/`; there is no configured project test runner. Third-party network requests were blocked during those checks, so analytics delivery and remote icon availability were not exercised.

## Follow-up: project-card height correction

The viewport review above preserved a pre-existing sizing defect: desktop cards were taller than the space available after the section heading, gaps, and GitHub bar. A subsequent layout correction replaces their fixed minimum height with the remaining grid-row height, capped at 50rem on desktop. Mobile card heights retain their available-space sizing.

AuthPreview now scales with its preview container, replacing the old overlay padding and large fixed offsets. On short screens, details scroll inside the card while preserving preview space; the mobile GitHub artwork also fits its available row.

The desktop height is additionally capped by the actual 850×1400 screenshot ratio plus the collapsed title row, removing unused bands below the images on tall displays. The grid track uses the same cap, so the GitHub bar stays exactly one lateral card gap below the cards (24px normally, 12px on short desktop screens), rather than gaining extra spacing from a larger grid track.

Screenshot previews retain their dimensions when descriptions appear: an invisible title spacer preserves the grid row while the real details panel overlays the screenshot. The authentication illustration remains in flow and adjusts its size when its description expands. Hover and keyboard-focus checks confirmed both behaviors.

Verified at 1366×768, 1440×900, 1920×1080, 2560×1440, 1024×600, 900×450, 320×568, 390×844, 768×844, and 740×390. The Projects pane has no vertical overflow, visible cards remain within its bounds, and authentication artwork remains within its preview both before and after hover/focus. Native horizontal swipes and fresh-swipe handoff from short-card details were also checked. Lint, TypeScript diagnostics, build, and the interaction regression checks passed.

## Follow-up: About typography and mobile spacing

The profile description now uses 1.25rem on desktop and retains 1.15rem on mobile. Mobile spacing between terminal-layout blocks increases by 0.3dvh on top of the existing clamped gap. Computed font sizes, gaps, and section interactivity were verified at 320×568, 390×844, 768×844, 1440×900, and 1920×1080.
