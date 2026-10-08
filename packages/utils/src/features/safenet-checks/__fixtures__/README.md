# Live-captured fixtures

| file                                       | provenance                                                                                                                                                                                                                                                                                                                                                                                                 | consumers                                                                                               |
| ------------------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------- |
| `sepolia-relaunch-attestation.golden.json` | **CAPTURED LIVE** from the redeployed (2026-08-20) Sepolia contracts (Consensus `0x23561B72…`) — a real `TransactionProposed` + `TransactionAttested` pair (attested block 11528818, a mainnet-home Safe), with the epoch-38429 group key from the deployed FROSTCoordinator. Its `requestId` was verified onchain to equal the `transactionProposalHash` this package derives — the EIP-712 parity proof. | `frost.test.ts`, `decodeLogs.test.ts`, `verifyAttestation.test.ts`, `safenetReader.integration.test.ts` |
| `sepolia-relaunch-lifecycle.json`          | **CAPTURED LIVE** from the same deployment and check — the full sentinel lifecycle (proposal tx `0xe8e7fb38…ddb8f`, block 11528809): `TransactionProposed`, `NewRequest`, 3× `Committed`, 3× `Revealed`, `OracleResult`, plus 3 `Claimed` logs the decoder must skip.                                                                                                                                      | `decodeLogs.test.ts`                                                                                    |
| `gnosis-plain-attestation.golden.json`     | **CAPTURED LIVE** from the deployed Gnosis mainnet beta (block 47435266, epoch 32941) — a real `TransactionAttested` with the epoch group key from the deployed FROSTCoordinator. The non-oracle preimage, the only path live beta emits.                                                                                                                                                                  | `frost.test.ts` golden-vector + tamper tests                                                            |
| `gnosis-plain-lifecycle.captured.json`     | **CAPTURED LIVE** from the deployed Gnosis mainnet beta Consensus (`0x223624cB…`) — a correlated `TransactionProposed` + `TransactionAttested` pair (an Arbitrum Safe, event `chainId` 42161) picked from a 2k-block window in which all 1,204 plain-pair logs decoded cleanly. The **only event family beta emits**; synthetic data cannot prove this layout.                                             | `decodeLogs.test.ts`                                                                                    |

Only CAPTURED data is checked in. Synthetic sequences are built in-test by the
`builders/rawLogs` factories, which encode through the same `Interface`s the
decoder parses with — they cannot drift from the fragments, and deliberate
fragment changes are guarded by the literal topic0 pins in `__tests__/abi.test.ts`.
Re-capture the Sepolia fixtures with `tools/safenet-proposer` (workspace repo)
against the live deployment; the Gnosis pair by scanning the beta Consensus.

## Safenet deployment on Gnosis Chain

`safenet-gnosis-chain.captured.json` retains one approved check and one split dispute
from the 2026-10-05 capture of the previous Gnosis deployment (Consensus `0x98810887…b390`,
Oracle `0x544F12bA…DDD0`, replaced on 2026-10-06). The approved check includes its epoch group key.
`safenetReader.test.ts` reads the raw logs through JSON-RPC and verifies the real signature.
That deployment emitted a seven-field `NewRequest`. Those logs are removed from the capture,
because the decoder reads only the current eight-field form (with `daoFeeShare`).

The active defaults use Consensus `0x73b4BDc3112Dfb86085cDD84f26Ab908B20A4A84`,
Coordinator `0xC6B34dA4c99C043A093214D58423a8bE39585B78`, and Oracle
`0xB83c4b66e752D947c1F55fd703b7937e21e401E4` on chain 100.
Council denial (`DisputeResolved` outcome `RESOLVED_DENIED` = 4) maps to `MALICIOUS` without another
`OracleResult`. Approval still requires a verified attestation.
Frozen disputes use `TIMED_OUT`; polling retains their arbitration deadline for late council results.
Explicit timeouts and out-of-scope events use `TIMED_OUT`.
The reader, snapshot, cache identity, and polling model remain unchanged.
