# Live-captured fixtures

Only CAPTURED data is checked in. Synthetic sequences are built in-test by the
`builders/rawLogs` factories, which encode through the same `Interface`s the
decoder parses with — they cannot drift from the fragments, and deliberate
fragment changes are guarded by the literal topic0 pins in `__tests__/abi.test.ts`.
For the Safenet deployment on Gnosis Chain, scan the addresses in `safenet-gnosis-chain.captured.json` provenance.
Retain the correlated proposal, oracle lifecycle, attestation, and epoch group key.

## Safenet deployment on Gnosis Chain

`safenet-gnosis-chain.captured.json` retains one approved check and one split dispute
from the 2026-10-05 capture of the previous Gnosis deployment (Consensus `0x98810887…b390`,
Oracle `0x544F12bA…DDD0`, replaced on 2026-10-06). The `approved-second` check includes its epoch group key.
It replaces the two retired Sepolia captures for requestId parity, FROST verification,
Safe home-chain decoding, and the complete oracle lifecycle, including unknown `Claimed` logs.
Consumers: `frost.test.ts`, `proposalHash.test.ts`, `decodeLogs.test.ts`,
`verifyAttestation.test.ts`, `safenetReader.integration.test.ts`, and `safenetReader.test.ts`.
The reader tests use the raw logs through JSON-RPC and verify the real signature.
That deployment emitted a seven-field `NewRequest`. Those logs are removed from the capture,
because the decoder reads only the current eight-field form (with `daoFeeShare`).

The active defaults use Consensus `0x73b4BDc3112Dfb86085cDD84f26Ab908B20A4A84`,
Coordinator `0xC6B34dA4c99C043A093214D58423a8bE39585B78`, and Oracle
`0xB83c4b66e752D947c1F55fd703b7937e21e401E4` on chain 100.
Council denial (`DisputeResolved` outcome `RESOLVED_DENIED` = 4) maps to `MALICIOUS` without another
`OracleResult`. Approval still requires a verified attestation.
Frozen disputes use `TIMED_OUT`; polling retains their arbitration deadline for late council results.
Explicit timeouts and out-of-scope events use `TIMED_OUT`.
The reader, snapshot, and cache identity remain unchanged. Checks without an on-chain
deadline retain fast polling; no elapsed-block deadline is inferred from their first event.
