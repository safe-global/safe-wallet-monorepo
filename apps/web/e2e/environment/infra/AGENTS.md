# Isolated backend

This directory and `.github/actions/isolated-e2e-backend` must run from a clean checkout with Docker Compose and Python alone. The action leaves the stack running; its calling workflow must clean up with `always()` after browser tests. Keep wallet/Cypress dependencies out of backend scripts.

Keep provider credentials in ignored `.env.test` files or GitHub secrets. Never upload raw container logs, resolved Compose configuration, environment files or database volumes; collect logs only through `scripts/test_env.py logs`, which redacts the provider URLs. Publish only explicit, reviewed diagnostic fields. The secret-using job must skip fork PRs and must not use `pull_request_target`.

After changes, run `yarn workspace @safe-global/web e2e:env:test` (type check and tests of `mocks/`), the Python helper tests, all-profile Compose validation and the backend bootstrap/smoke checks. Preserve deployment registration, the fork indexing floor and separate service/chain databases, Redis databases and RabbitMQ task virtual hosts. Reset only the selected chain's storage. PostgreSQL major-version changes require fresh disposable volumes.

## Mocks

The provider mocks and fork helpers in `mocks/` are TypeScript. The pinned `NODE_IMAGE` runs them directly with type stripping, so there is no build step and no npm dependency. Write a new mock or helper there, not in Python; Python stays only for code that runs inside the Python services (Django commands, decoder scripts, Transaction Service checks).

Mocks are test code that anyone can run on a host, so they must be harmless when they run:

- Import only `node:` built-ins and other files in `mocks/`. Do not start processes, write files or evaluate code. Keep test state in memory and change it through `/__test/...` routes.
- Listen on `listenHost()`: `127.0.0.1` unless Compose sets `MOCK_HOST`.
- Extend `x-mock` in Compose (non-root, read-only, no capabilities, `no-new-privileges`) and never override its `entrypoint`, `user` or `read_only`. A mock on port 443 uses the `ip_unprivileged_port_start` sysctl, not root.
- Use only throwaway test keys. Never log a provider URL, not even inside an error message.

`mocks/hardening.test.ts` enforces these rules.
