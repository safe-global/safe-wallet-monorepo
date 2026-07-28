# Safenet read-layer test fixtures

Provenance for the checked-in JSON the decoder + FROST tests run against.

| File                                | Provenance                                                                                                                                                                                                                                                                                                               | Used by                                                      |
| ----------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------ |
| `devnet-attestation.golden.json`    | **CAPTURED LIVE** from the devnet (`:8547`, chainId 31337) by proposing an oracle transaction against the `AlwaysApproveOracle`; real validators produced the FROST attestation. Contains `{chainId, consensus, epoch, oracle, safeTxHash, requestId, groupKey{x,y}, r{x,y}, z}`.                                        | `frostVerify.test.ts` golden-vector + per-field tamper tests |
| `consensus-lifecycle.captured.json` | **CAPTURED LIVE** from the same devnet run — the real `OracleTransactionProposed`, `OracleResult` (from `AlwaysApproveOracle`), and `OracleTransactionAttested` logs. Consensus events are generation-agnostic; the devnet runs repo-HEAD (V2-era).                                                                      | `decodeLogs.test.ts`                                         |
| `v2-lifecycle.synth.json`           | **SYNTHESIZED** — ABI-encoded from the exact V2 `SentinelOracleV2` event fragments via the same `ethers.Interface` the decoder uses (the devnet's V2 oracle has no sentinel service running, so `Committed`/`Revealed` can't be captured end-to-end). Wire-accurate: the proposed-event topic0 matches the live capture. | `decodeLogs.test.ts`                                         |
| `v1-lifecycle.synth.json`           | **SYNTHESIZED** — ABI-encoded from the exact V1 `SentinelOracle` event fragments. The sim (`:8546`, the V1 event source) was not running at capture time, so V1 `NewRequest`/`Committed` shapes are taken verbatim from the Solidity and encoded through the decoder's own `Interface`.                                  | `decodeLogs.test.ts`                                         |

Regenerate the synthesized fixtures with the `rawLogs` builders (see git history for
the one-off `_genfix.ts` script) or re-capture the live ones by proposing against the
running devnet. The golden vector's `requestId` was verified onchain to equal the
`oracleProposalHash` this package derives — that equality is the parity proof for the
EIP-712 port.
