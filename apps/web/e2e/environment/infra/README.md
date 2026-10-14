# Isolated Safe backend

Docker Compose environment for validating Safe APIs against a pinned Anvil Sepolia fork. Includes Client Gateway (CGW), Transaction Service (TXS), Config Service, Decoder Service and Events Service. Backend checks cover deployment registration, indexing from the fork block and the Safe transaction lifecycle through CGW. Wallet builds and browser tests are outside this workflow.

## Requirements

- Docker with Compose v2 and an ARM64 host. The pinned CGW image is ARM64-only.
- Python 3.9 or later for `scripts/test_env.py`. The mocks in `mocks/` are TypeScript and run in the pinned Node image, so the host needs no Node.
- A Sepolia RPC endpoint with archive access at the block pinned in `test-images.env`.

## Local setup

This environment uses public test credentials and Anvil accounts. Keep it private and never fund these accounts on a real network.

Run these commands from this directory:

```sh
cp .env.test.sample .env.test
```

Set `SEPOLIA_FORK_RPC_URL` in `.env.test` to the complete Sepolia RPC URL, including its API key. Then run:

```sh
python3 -m unittest discover -s tests
python3 scripts/test_env.py up
python3 scripts/test_env.py test
python3 scripts/test_env.py smoke
```

Default endpoints:

| Service | URL                                             |
| ------- | ----------------------------------------------- |
| Anvil   | `http://localhost:8545`                         |
| CGW     | `http://localhost:8000/cgw`                     |
| TXS     | `http://localhost:8000/txs/api`                 |
| Decoder | `http://localhost:8000/decoder`                 |
| Billing | `http://localhost:8000/billing`                 |
| Auth0   | `https://auth.safe-e2e.test` (`127.0.0.1:8443`) |

Use `python3 scripts/test_env.py status` to inspect containers. `python3 scripts/test_env.py logs [service...] [--tail N|all]` prints container logs with every fork provider URL replaced by `<fork-provider>`. Remove the project's containers and volumes with `python3 scripts/test_env.py reset`; `status`, `down` and `reset` work without a provider URL. Reset before starting a new fork so backend databases remain consistent with chain state.

Check the mocks with `yarn workspace @safe-global/web e2e:env:test`, which type-checks `mocks/` and runs its tests.

The CoW API mock answers unrecorded requests with 404 (`COW_API_OFFLINE: 'true'` in Compose). Set it to `false` to forward them to the real `api.cow.fi` while capturing new recordings.

## Configuration

`test-images.env` pins container images, chain IDs and fork blocks. The optional, ignored `.env.test` file overrides those defaults; exported environment variables take precedence over both files. Service settings are checked in under `container_env_files/` and referenced by Compose.

| Variable               | Purpose                                                                             |
| ---------------------- | ----------------------------------------------------------------------------------- |
| `SEPOLIA_FORK_RPC_URL` | Required Sepolia archive RPC URL                                                    |
| `SAFE_E2E_PROJECT`     | Exported project name; defaults to `safe-e2e-local` and must start with `safe-e2e-` |
| `RPC_PORT`             | Local Anvil port; defaults to `8545`                                                |
| `REVERSE_PROXY_PORT`   | Local API port; defaults to `8000`                                                  |
| `AUTH0_MOCK_PORT`      | Local port of the Auth0 mock; defaults to `8443`                                    |
| `FORK_RPC_URL_MAINNET` | Archive RPC URL for the optional mainnet profile                                    |
| `FORK_RPC_URL_POLYGON` | Archive RPC URL for the optional Polygon profile                                    |

After starting Sepolia, add an optional chain with `python3 scripts/test_env.py up --chain mainnet` or `--chain polygon`. Remove it with `reset --chain <name>`; other chains remain running.
