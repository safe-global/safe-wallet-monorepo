# Safenet read-layer test fixtures

Provenance for the checked-in JSON the FROST tests run against. Both vectors are
**captured live** — real validators produced both signatures.

| File                                   | Provenance                                                                                                                                                                        | Used by                                              |
| -------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------- |
| `gnosis-plain-attestation.golden.json` | **Gnosis mainnet beta**, non-oracle path — a real `TransactionAttested` at block 47435266, with the epoch group key read from the deployed FROSTCoordinator. Captured 2026-07-28. | `frost/verify.test.ts`, `oracleProposalHash.test.ts` |
| `devnet-attestation.golden.json`       | **Devnet** (`:8547`, chainId 31337, repo HEAD) — an oracle transaction proposed against the `AlwaysApproveOracle`; real validators produced the FROST attestation.                | `frost/verify.test.ts`, `oracleProposalHash.test.ts` |

Two vectors, two paths, two contract versions — the deployed beta Consensus and
repo HEAD are not the same contract (see below).

## Why both are needed

`plainProposalHash` and `oracleProposalHash` differ by one field and sign
different EIP-712 typehashes. Each vector proves its own preimage end to end: if
the domain, the typehash, or the field encoding were wrong, verification would
fail. Neither can be faked by a bug in our own code, because the signature was
produced by validators that never saw it.

### The domain chain id is the Safenet chain, not the Safe's chain

The Gnosis vector makes this concrete. Its `TransactionAttested` event carries
`chainId = 42161` (the Safe lives on Arbitrum), but the EIP-712 domain uses
`chainId = 100` — Gnosis, where Consensus is deployed. Deriving the preimage
with the event's `chainId` fails verification. `verify.test.ts` asserts both
directions, so a reader that reaches for the wrong field fails the build.

## What the deployed beta contract actually contains

Checked against `eth_getCode` on Consensus
`0x223624cBF099e5a8f8cD5aF22aFa424a1d1acEE9` (Gnosis, 2026-07-28). It is **not**
a proxy — the EIP-1967 implementation slot is zero, so this is the code that
runs.

| probe                                                              | result     |
| ------------------------------------------------------------------ | ---------- |
| `EIP712Domain(uint256 chainId,address verifyingContract)` typehash | present    |
| `TransactionProposal(uint64 epoch,bytes32 safeTxHash)` typehash    | present    |
| `OracleTransactionProposal(...)` typehash                          | **absent** |
| `proposeTransaction` selector                                      | present    |
| `proposeOracleTransaction` selector                                | **absent** |

So the oracle path does not exist in the beta deployment — this is stronger than
"no oracle traffic yet". Beta cannot emit `OracleTransaction*` events at all,
which is why the oracle vector had to come from the devnet, and why the client's
oracle allowlist is empty by default.

## Regenerating

Re-capture the Gnosis vector by scanning Consensus for a recent
`TransactionAttested` (topic0
`0x72272729e643703db011cc155474c30d652f1a68712d921cc263a881efd7bce6`), reading
`getEpochGroupId(epoch)` then `groupKey(groupId)`. Re-capture the devnet vector
by proposing against a running devnet (`make devnet-up` in the workspace repo).
