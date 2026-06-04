# SPDX-License-Identifier: FSL-1.1-MIT

# Dev container image for safe-client-gateway.
# Production image is unchanged and lives at the repo-root Dockerfile.
# Microsoft only publishes major-version tags for this image, so we pin by
# digest to keep dev environments reproducible. Production currently uses
# Node 24.11.0; refresh the digest periodically (or via Renovate/Dependabot)
# to pick up the latest 24.x patch.
FROM mcr.microsoft.com/devcontainers/typescript-node:24-bookworm@sha256:14484cf5f183867fbdddd69db1991ee9a82fc50ff378f40344dcc31824eb834e

# Microsoft's image runs as the `node` user by default; switch to root
# for system installs and to enable Corepack.
USER root

# Install postgres-client for inspecting db / db-test from inside the container.
RUN apt-get update \
    && apt-get install -y --no-install-recommends postgresql-client \
    && apt-get clean \
    && rm -rf /var/lib/apt/lists/*

# Activate Corepack so Yarn 4.14.1 (pinned in .yarnrc.yml) resolves the
# project-managed release on first install.
RUN corepack enable

USER node
