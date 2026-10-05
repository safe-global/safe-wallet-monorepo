# Live-captured fixtures

| file                                       | provenance                                                                                                                                                                                                                                                                                                                                                                                                 | consumers                                                 |
| ------------------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------- |
| `sepolia-relaunch-attestation.golden.json` | **CAPTURED LIVE** from the redeployed (2026-08-20) Sepolia contracts (Consensus `0x23561B72…`) — a real `TransactionProposed` + `TransactionAttested` pair (attested block 11528818, a mainnet-home Safe), with the epoch-38429 group key from the deployed FROSTCoordinator. Its `requestId` was verified onchain to equal the `transactionProposalHash` this package derives — the EIP-712 parity proof. | `decodeLogs.test.ts`, `safenetReader.integration.test.ts` |
| `sepolia-relaunch-lifecycle.json`          | **CAPTURED LIVE** from the same deployment and check — the full sentinel lifecycle (proposal tx `0xe8e7fb38…ddb8f`, block 11528809): `TransactionProposed`, `NewRequest`, 3× `Committed`, 3× `Revealed`, `OracleResult`, plus 3 `Claimed` logs the decoder must skip.                                                                                                                                      | `decodeLogs.test.ts`                                      |
| `gnosis-plain-attestation.golden.json`     | **CAPTURED LIVE** from the deployed Gnosis mainnet beta (block 47435266, epoch 32941) — a real `TransactionAttested` with the epoch group key from the deployed FROSTCoordinator. The non-oracle preimage, the only path live beta emits.                                                                                                                                                                  | `frost.test.ts` golden-vector + tamper tests              |
| `gnosis-plain-lifecycle.captured.json`     | **CAPTURED LIVE** from the deployed Gnosis mainnet beta Consensus (`0x223624cB…`) — a correlated `TransactionProposed` + `TransactionAttested` pair (an Arbitrum Safe, event `chainId` 42161) picked from a 2k-block window in which all 1,204 plain-pair logs decoded cleanly. The **only event family beta emits**; synthetic data cannot prove this layout.                                             | `decodeLogs.test.ts`                                      |

Only CAPTURED data is checked in. Synthetic sequences are built in-test by the
`builders/rawLogs` factories, which encode through the same `Interface`s the
decoder parses with — they cannot drift from the fragments, and deliberate
fragment changes are guarded by the literal topic0 pins in `__tests__/abi.test.ts`.
Re-capture the Sepolia fixtures with `tools/safenet-proposer` (workspace repo)
against the live deployment; the Gnosis pair by scanning the beta Consensus.

## `gnosis-aegis.json`

Three live captures from the Gnosis Chain test deployment (chain 100; Consensus `0x98810887…`, Oracle `0x544F12bA…`,
deployed at block 48,280,806; not proven production). `provenance` records the addresses, `capturedAt` and the RPC.
Each capture holds the raw `eth_getLogs` entries of one check (Consensus logs by `safeTxHash`, Oracle logs by
`requestId`) and the verbatim ABI bytes `getRequest(bytes32)` returned at the fixed block
`requestState.blockNumber` (48,597,645), so the expectation stays stable after the request settles.

Captures: `approved-first` and `approved-second` (`RESOLVED_APPROVED`, 2 approve), and
`disputed-split` (`FROZEN`, 1 approve, 1 deny).

Consumers: `abi.test.ts`, `decodeLogs.test.ts`, `proposalHash.test.ts`, `frost.test.ts`,
`verifyAttestation.test.ts`, and `safenetReader.requests.test.ts`.
