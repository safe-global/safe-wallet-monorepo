# Safe UI docs site

The docs site and shadcn registry for [`@safe-global/ui`](../../packages/ui): a landing page, the docs (`/docs/`), a filterable component index (`/components/`), a type scale playground (`/typeset/`) and a project generator (`/create/`). It is a plain static site: `out/` deploys to any static host. Contributor rules: [AGENTS.md](AGENTS.md).

## Run it

```bash
yarn workspace @safe-global/design-system dev      # http://localhost:3100
```

## Build and preview

```bash
yarn workspace @safe-global/design-system build
yarn workspace @safe-global/design-system serve    # serves out/ on http://localhost:3100
```

`build` generates the docs data from `packages/ui`, builds the registry into `public/r/` and exports the site to `out/`, with `index.html` in a folder per route.

## Base path

To serve the site from a subfolder, set the base path at build time:

```bash
NEXT_PUBLIC_BASE_PATH=/safe-ui yarn workspace @safe-global/design-system build
```

Then serve `out/` under `/safe-ui/`. `NEXT_PUBLIC_ASSET_PREFIX` moves the `_next/` assets elsewhere, and `NEXT_PUBLIC_SITE_URL` sets the absolute URL used in metadata and `llms.txt`.

## Registry

The registry is served next to the site at `<origin><base path>/r/<name>.json`. A consumer adds it to `components.json`:

```json
{
  "registries": {
    "@safe": "https://<docs-host>/r/{name}.json"
  }
}
```

and runs `npx shadcn@latest add @safe/theme @safe/button`. The Installation and Create pages show the URL of whichever host serves it; set `NEXT_PUBLIC_REGISTRY_URL` to show a fixed one.
