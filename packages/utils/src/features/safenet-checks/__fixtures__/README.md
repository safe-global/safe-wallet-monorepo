# Live-captured fixtures

| file                | provenance                                                                                                                                                                                                                                                                                                       | consumers                                                                                                                                                                                                                                                    |
| ------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `gnosis-aegis.json` | **CAPTURED LIVE** from the Gnosis Chain test deployment (chain 100; Consensus `0x98810887…`, FROSTCoordinator `0x2f88C123…`, Oracle `0x544F12bA…`): four real checks of Safes on home chain `1` — two APPROVED lifecycles with their FROST attestations and epoch group key, and two FROZEN (DISPUTED) requests. | `abi.test.ts`, `decodeLogs.test.ts`, `proposalHash.test.ts`, `frost.test.ts`, `verifyAttestation.test.ts`, `safenetReader.test.ts`, `safenetReader.requests.test.ts`, `safenetReader.integration.test.ts`, and `safenetCheckApi.test.ts` in `packages/store` |

`gnosis-aegis.json` is the only captured fixture.

## Shape

`{ provenance, captures }`. `provenance` records where the data came from:
`chainId`, `consensus`, `coordinator`, `oracle`, `deploymentBlock`,
`deploymentClassification` (a live test deployment — MTK token, not proven
production or latest source), `capturedAt`, `rpc`, `requestStateBlock` and
`requestStateSource`. `deploymentBlock` (48,280,806) is the block where the
Consensus and the Oracle first have code, and the reader's log-scan floor. It is
not the FROSTCoordinator's deployment block: the Coordinator already has code
at block 48,263,142. The reader scans only Consensus and Oracle logs, so the
floor is correct.

Each capture carries:

- `label`, `kind` (`attested` or `disputed`), `safeTxHash`, `homeChainId`,
  `safe`, `epoch`, `requestId`, `oracleDataHash`.
- `timestampMs`: the submission time the reader aims its discovery window with.
  A hint, never proof.
- `proposal`: the block, log index and transaction of the `TransactionProposed`
  log.
- `attestation` and `groupKey`: the FROST signature (`signatureId`, `r`, `z` and
  its log position) and the epoch group key read from the FROSTCoordinator.
  Both are `null` on the disputed captures.
- `logs`: raw `eth_getLogs` entries in the shape the decoder takes (`address`,
  `topics`, `data`, `blockNumber`, `logIndex`, `transactionHash`; ethers' `index`
  is carried as `logIndex`).
- `requestState`: the verbatim ABI bytes `getRequest(bytes32)` returned for
  `requestId` (`rawResult`), at `blockNumber`.
- `expected`: the state, outcome, sentinel counts and attestation verification
  the capture must decode to.

| label                     | kind       | request       | what it pins                                                                                                                                                                                           |
| ------------------------- | ---------- | ------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `approved-first`          | `attested` | `0xa871…07a7` | Epoch 161991. 2 committed, 2 revealed (both approve), `OracleResult`, then `TransactionAttested` (`signatureId` ending `…0010`). State `RESOLVED_APPROVED`, attestation VERIFIED.                      |
| `approved-second`         | `attested` | `0xfc89…51ed` | A different Safe and `safeTxHash` from `approved-first` — not a sibling, and not a wrong-key vector: both approved captures are signed by the same epoch-161991 group key. `signatureId` ends `…0011`. |
| `disputed-split`          | `disputed` | `0xfc47…79e1` | Epoch 161977. 2 committed, 2 revealed (1 approve, 1 deny), `DisputeTriggered`. State `FROZEN`, outcome DISPUTED. No attestation, no group key.                                                         |
| `disputed-three-revealed` | `disputed` | `0xbe2d…4624` | Epoch 161977. 3 committed, 3 revealed (2 approve, 1 deny), `DisputeTriggered`. State `FROZEN`, outcome DISPUTED. No attestation, no group key.                                                         |

## Filtering

`logs` is not a block dump. Each capture keeps only the Consensus logs whose
`safeTxHash` topic equals the capture's hash and the Oracle logs whose
`requestId` topic equals the capture's request. The approved captures therefore
include the Oracle's `Claimed(bytes32,address,uint96,uint96)` logs, which are not
in our fragments: the decoder must skip them.

## Fixed history

`requestState` is read at the fixed block `requestStateBlock`, not at the live
head. A frozen request may settle later on the live chain; the committed
fixtures stay fixed history, so DISPUTED is their stable expectation.

## Synthetic data and re-capturing

Only CAPTURED data is checked in. Synthetic sequences are built in-test by the
`builders/rawLogs` factories, which encode through the same `Interface`s the
decoder parses with — they cannot drift from the fragments, and deliberate
fragment changes are guarded by the literal topic0 pins in `__tests__/abi.test.ts`.

To re-capture, scan the Consensus (`safeTxHash` topic) and the Oracle
(`requestId` topic) with `eth_getLogs`, call `getRequest(bytes32)` at a pinned
block, and read the epoch group key from the FROSTCoordinator. Keep
`provenance` accurate and update `expected`.
