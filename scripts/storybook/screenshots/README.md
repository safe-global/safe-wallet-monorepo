# Product screenshots

Current Safe{Wallet} screenshots for decks and marketing, straight from a branch preview. No Figma, no real Safes: every screen is a Storybook story with sample data.

## Run it

You need this repo and Node 24 (`.nvmrc`). Playwright uses your installed Google Chrome. From the repo root:

```bash
corepack yarn workspace @safe-global/web storybook:screenshots --base=dev
```

That captures every app page (`Pages/**`) from the dev environment, in light and dark, at 1440×900 and 2× scale.

## Three common runs

All live app pages from the latest `dev`:

```bash
corepack yarn workspace @safe-global/web storybook:screenshots --base=dev --stories="Pages/**"
```

One PR's prototypes, by its branch name:

```bash
corepack yarn workspace @safe-global/web storybook:screenshots --base=design/policies-m2-edit-panels --stories="Prototype/Policies M2*"
```

One story, by its id (the `?id=` in the Storybook URL), dark only, plus the wide size:

```bash
corepack yarn workspace @safe-global/web storybook:screenshots --base=dev --stories=pages-core-home--default --themes=dark --sizes=desktop,wide
```

## Where the files land

In `screenshots/` at the repo root (git ignores it):

```
screenshots/
  live/       Pages/* stories, what the product looks like today
    pages-core-home--default-dark-desktop.webp
    index.json
  preview/    everything else, including Prototype/* work in progress
  skipped.txt stories that never finished loading, with the reason
```

Files are named `<story-id>-<theme>-<size>.webp`. Each `index.json` follows the Safe{Labs} design system's `slides/img/visuals/index.json` (`name`, `dark`, `w`, `h`, `bleed`) and adds `status`, `theme`, `size`, `story`, `source`, `branch`, `commit`, `version` and `capturedAt`. Re-running adds to the existing index.

## Options

| Option          | Default        | What it does                                                                                                 |
| --------------- | -------------- | ------------------------------------------------------------------------------------------------------------ |
| `--base`        | (required)     | Branch name, `dev` for the dev environment, or a preview URL. Only `*.review.5afe.dev`, dev and `localhost`  |
| `--stories`     | `Pages/**`     | Comma-separated story ids or title patterns. `*` stays inside one title segment, `**` crosses them, any case |
| `--themes`      | `light,dark`   | `light`, `dark` or both                                                                                      |
| `--sizes`       | `desktop`      | `desktop` (1440×900), `wide` (1920×1080) or both                                                             |
| `--scale`       | `2`            | Pixel density                                                                                                |
| `--crop`        | `viewport`     | `component` crops to what the story shows, for close-ups of a panel or card (use with `--scale=3`)           |
| `--out`         | `screenshots/` | Output folder                                                                                                |
| `--quality`     | `0.92`         | WebP quality, 0 to 1                                                                                         |
| `--concurrency` | `3`            | Stories captured at once                                                                                     |

Story titles often continue after a space or dash, like `Prototype/Policies M2 – full flow`, so end a pattern with `*` rather than `/**` to catch them. A pattern that matches nothing lists the titles the preview has.

## No terminal?

In GitHub, open Actions → **Storybook screenshots** → Run workflow, enter the branch and stories, and download the `screenshots` artifact when it finishes.

## What it waits for

Each capture waits for Storybook to finish the story, the network to go quiet, fonts and images to load and every spinner or skeleton to disappear. It hides the dev-only sidebar toggles and Developer group, and the Prototype bar. A story that is still loading after 20 seconds, shows a broken image or renders an empty page gets one retry, then goes to `skipped.txt` instead of being captured half-loaded.
