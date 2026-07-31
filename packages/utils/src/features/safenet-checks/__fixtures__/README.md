# Safenet read-layer test fixtures

Provenance for the checked-in JSON the decoder + FROST tests run against.

| File                                   | Provenance                                                                                                                                                                                                                                                                                                                                                     | Used by                                      |
| -------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------- |
| `devnet-attestation.golden.json`       | **CAPTURED LIVE** from the devnet (`:8547`, chainId 31337) by proposing an oracle transaction against the `AlwaysApproveOracle`; real validators produced the FROST attestation. Contains `{chainId, consensus, epoch, oracle, safeTxHash, requestId, groupKey{x,y}, r{x,y}, z}`.                                                                              | `frost.test.ts` golden-vector + tamper tests |
| `gnosis-plain-attestation.golden.json` | **CAPTURED LIVE** from the deployed Gnosis mainnet beta (block 47435266, epoch 32941) — a real `TransactionAttested` with the epoch group key from the deployed FROSTCoordinator. The non-oracle preimage, the only path live beta emits.                                                                                                                      | `frost.test.ts` golden-vector + tamper tests |
| `consensus-lifecycle.captured.json`    | **CAPTURED LIVE** from the same devnet run — the real `OracleTransactionProposed`, `OracleResult` (from `AlwaysApproveOracle`), and `OracleTransactionAttested` logs. Consensus events are generation-agnostic; the devnet runs repo-HEAD (V2-era).                                                                                                            | `decodeLogs.test.ts`                         |
| `gnosis-plain-lifecycle.captured.json` | **CAPTURED LIVE** from the deployed Gnosis mainnet beta Consensus (`0x223624cB…`) — a correlated `TransactionProposed` + `TransactionAttested` pair (an Arbitrum Safe, event `chainId` 42161) picked from a 2k-block window in which all 1,204 plain-pair logs decoded cleanly. The **only event family beta emits**; synthetic data cannot prove this layout. | `decodeLogs.test.ts`                         |

Only CAPTURED data is checked in. Synthetic sequences are built in-test by the
`builders/rawLogs.ts` factories, which ABI-encode through the exact `Interface`s
the decoder reads — one source of truth, no frozen copies to drift. Deliberate
fragment changes are guarded by the literal topic0 pins in `__tests__/abi.test.ts`.
Re-capture the live fixtures by proposing against the running devnet. The golden
vector's `requestId` was verified onchain to equal the `oracleProposalHash` this
package derives — that equality is the parity proof for the EIP-712 port.
