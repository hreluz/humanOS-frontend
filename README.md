# HumanOS Frontend

Nuxt 4 app for HumanOS.

## Requirements

- Node `v24.21.0` (see `.nvmrc`)
- pnpm (version pinned in `package.json` via `packageManager`)

## Setup

```bash
nvm use            # use the Node version in .nvmrc
corepack enable    # provides the pinned pnpm version
pnpm install
```

## Development

Start the [humanOS-backend](../humanOS-backend) first. The app calls the API at `http://localhost:8000/api` by default.

```bash
pnpm dev           # http://localhost:3000
```

To use a different API:

```bash
NUXT_PUBLIC_API_BASE=https://your-api/api pnpm dev
```

## Scripts

| Command | Description |
| --- | --- |
| `pnpm dev` | Start the dev server |
| `pnpm build` | Build for production |
| `pnpm preview` | Serve the production build locally |
| `pnpm test` / `pnpm test:watch` | Run Vitest unit tests |
| `pnpm test:e2e` | Run Playwright tests on port 3100 (needs the backend running) |
| `pnpm screenshots` | Run the Playwright screenshot specs |
| `pnpm lint` / `pnpm lint:fix` | Lint the code, or lint and fix it |
| `pnpm typecheck` | Run the Nuxt and test type checks |
| `pnpm gen:api` | Regenerate `app/types/api.generated.ts` from the backend's OpenAPI spec |
