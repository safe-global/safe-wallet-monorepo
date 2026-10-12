# Isolated backend

This directory and `.github/actions/isolated-e2e-backend` must run from a clean checkout with Docker Compose and Python alone. The action leaves the stack running; its calling workflow must clean up with `always()` after browser tests. Keep wallet/Cypress dependencies out of backend scripts.

Keep provider credentials in ignored `.env.test` files or GitHub secrets. Never upload raw container logs, resolved Compose configuration, environment files or database volumes; collect logs only through `scripts/test_env.py logs`, which redacts the provider URLs. Publish only explicit, reviewed diagnostic fields. The secret-using job must skip fork PRs and must not use `pull_request_target`.

After changes, run the Python helper tests, all-profile Compose validation and the backend bootstrap/smoke checks. Preserve deployment registration, the fork indexing floor and separate service/chain databases, Redis databases and RabbitMQ task virtual hosts. Reset only the selected chain's storage. PostgreSQL major-version changes require fresh disposable volumes.
