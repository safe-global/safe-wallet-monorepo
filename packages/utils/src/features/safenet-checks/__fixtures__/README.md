# Safenet read-layer test fixtures

Provenance for the checked-in JSON the FROST tests run against.

| File                             | Provenance                                                                                                                                                                                                                                                                        | Used by                                                       |
| -------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------- |
| `devnet-attestation.golden.json` | **CAPTURED LIVE** from the devnet (`:8547`, chainId 31337) by proposing an oracle transaction against the `AlwaysApproveOracle`; real validators produced the FROST attestation. Contains `{chainId, consensus, epoch, oracle, safeTxHash, requestId, groupKey{x,y}, r{x,y}, z}`. | `frost/verify.test.ts` golden-vector + per-field tamper tests |

Re-capture the live fixture by proposing against the running devnet. The golden
vector's `requestId` was verified onchain to equal the `oracleProposalHash` this
package derives — that equality is the parity proof for the EIP-712 port.
