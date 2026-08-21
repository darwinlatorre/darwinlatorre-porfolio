# Darwin Latorre Portfolio

Personal portfolio built with Astro.

## Requirements

- Node.js 22.12 or later
- npm

## Development

```sh
npm install
npm run dev
```

The development server runs at `http://localhost:4321`.

## Quality and Build

```sh
npm run lint
npm run build
```

## Docker

Build and run the production site at `http://localhost:4321`:

```sh
docker compose up --build
```

Stop and remove the container:

```sh
docker compose down
```

## Branches and Deployment

- `dev` is the active development branch.
- `main` contains production-ready changes and is deployed by Vercel.
