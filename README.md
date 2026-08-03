# cooklang-web

A web server for managing [Cooklang](https://cooklang.org/) recipes, shopping lists, and pantries. Built with SvelteKit and designed to help you organize your cooking workflow. Cooklang is a markup language for cooking recipes that allows you to define ingredients, cookware, and timers in a structured format.

![Main page screenshot](screenshots/list.png)

### Features

- **Recipe Management**: Store, view, and manage your cooklang recipes
- **Shopping Lists**: Generate and manage shopping lists from your recipes
- **Pantry Tracking**: Keep track of ingredients you have on hand

## Tech Stack

- **Framework**: [SvelteKit](https://kit.svelte.dev/) - Full-stack web framework
- **UI Components**: [Skeleton UI](https://www.skeleton.dev/) - Tailwind-based component library
- **Styling**: [Tailwind CSS](https://tailwindcss.com/) v4
- **Icons**: [Lucide Svelte](https://lucide.dev/)
- **Recipe parsing**: [@cooklang/cooklang](https://github.com/cooklang/cooklang-rs) (WASM) for display, plus the [cook CLI](https://github.com/cooklang/cookcli) for shopping lists
- **Images**: [imgproxy](https://imgproxy.net/) behind a caching [Caddy](https://caddyserver.com/)
- **Deployment**: Node.js adapter, shipped as a container

## Development

### Prerequisites

- Node.js (LTS version recommended)
- npm, pnpm, or yarn

### Setup

Install dependencies:

```sh
npm install
```

### Running the Development Server

Start the development server with hot module replacement:

```sh
npm run dev
```

### Type Checking

Run TypeScript and Svelte type checking:

```sh
npm run check
```

Or run in watch mode:

```sh
npm run check:watch
```

## Building

Create a production build:

```sh
npm run build
```

Preview the production build locally:

```sh
npm run preview
```

## Deployment

The recipe library is expected to live on network storage, which is slow to
read from. Two things keep that off the request path:

- **A recipe index.** Recipes are read and parsed once and kept in memory,
  refreshed only when a file's mtime or size changes.
- **An image pipeline.** `imgproxy` resizes images to the sizes actually
  rendered, and a caching Caddy in front of it means a given derivative is
  produced once. A typical recipe photo drops from ~950 KB to ~40 KB.

```
browser → caddy (cache) → imgproxy → recipe directory (read-only)
                        → app      → recipe directory (read-write)
```

Copy `.env.example` to `.env`, set `RECIPES_HOST_PATH` to the recipe
directory, generate a signing key pair, and start the stack:

```sh
openssl rand -hex 32
```

```sh
docker compose up -d
```

Only Caddy publishes a port. `imgproxy` is reachable solely from inside the
compose network, so it cannot be used as an open image resizer.

### Configuration

| Variable              | Default     | Purpose                                                        |
| --------------------- | ----------- | -------------------------------------------------------------- |
| `RECIPE_PATH`         | `./recipes` | Directory holding `.cook` files                                |
| `COOK_CLI_PATH`       | `cook`      | Cook CLI binary, used for shopping lists                       |
| `COOK_CLI_TIMEOUT`    | `30000`     | Cook CLI timeout in ms                                         |
| `RECIPE_INDEX_TTL_MS` | `30000`     | How long the index serves before re-stat'ing (`0` in dev)      |
| `IMGPROXY_BASE_URL`   | _unset_     | Where imgproxy is mounted. Unset serves originals from the app |
| `IMGPROXY_KEY`        | _unset_     | Hex URL-signing key                                            |
| `IMGPROXY_SALT`       | _unset_     | Hex URL-signing salt                                           |

Both `IMGPROXY_KEY` and `IMGPROXY_SALT` must be set alongside
`IMGPROXY_BASE_URL`; if they are not, the app logs a warning and falls back to
serving original images itself.

The `cook` CLI is only needed for shopping lists. Without it the rest of the
app works, and `/shopping` explains what is missing rather than failing.
