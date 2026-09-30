<!-- SPDX-License-Identifier: FSL-1.1-MIT -->

# Dev Container

A ready-to-use, reproducible development environment for the Safe{Wallet} monorepo. It runs Node 24 (pinned by digest), Yarn 4 via Corepack, and ships the editor extensions and Claude Code setup the team uses.

## Prerequisites

- **Docker** running on your host — Docker Desktop (macOS/Windows) or Docker Engine (Linux).
- An IDE with Dev Container support, plus the matching extension (see below).

## Open in your IDE

The Dev Containers feature is **IDE-specific**. Install the extension that matches your editor — they are not interchangeable.

### VS Code

1. Install the **Dev Containers** extension (`ms-vscode-remote.remote-containers`).
2. Open this repo, then run **Dev Containers: Reopen in Container** from the Command Palette (`Cmd/Ctrl+Shift+P`).

### Cursor

Cursor **cannot** use Microsoft's `ms-vscode-remote.remote-containers` extension — Microsoft licenses it for use only in official Microsoft products. Cursor ships its own equivalent:

1. Install the **Dev Containers** extension published for Cursor from Cursor's Extensions marketplace (do not install the Microsoft one).
2. Run **Dev Containers: Reopen in Container** from Cursor's Command Palette.

> Both IDEs are supported by the container scripts — `post-attach.sh` resolves the bundled `claude` CLI from either the VS Code (`.vscode-server`) or Cursor (`.cursor-server`) extension directory automatically.

## Lifecycle

- **[`post-create.sh`](./post-create.sh)** — runs once after the container is created: enables Corepack and runs `yarn install --immutable` (with a raised Node heap ceiling to avoid OOM).
- **[`post-attach.sh`](./post-attach.sh)** — runs on every attach: puts the bundled `claude` CLI on `PATH` and installs the official Claude Code marketplace + `superpowers` plugin (idempotent).

## Resources & ports

- Port **3000** is forwarded for the web app (`yarn workspace @safe-global/web dev`).
- Memory/CPU limits (16 GB / 4 CPUs) are set in [`docker-compose.yml`](./docker-compose.yml). These only apportion what the Docker VM already has — raise the VM ceiling in **Docker Desktop → Settings → Resources** first if needed.
