import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { SafenetReader } from '../safenetReader'
import { decodeLogs, type RawLog } from '../../utils/decodeLogs'
import { AttestationVerificationStatus, CheckEventType, type Hex, type OracleAttestedEvent } from '../../types'

/**
 * Opt-in live Gnosis checks:
 * SAFENET_IT_RPC=https://rpc.gnosischain.com yarn workspace @safe-global/utils test:integration
 * Addresses default to the capture provenance; SAFENET_CONSENSUS,
 * SAFENET_COORDINATOR, and SAFENET_ORACLE can override them.
 */
const fixture = JSON.parse(
  readFileSync(join(__dirname, '../../__fixtures__/safenet-gnosis-chain.captured.json'), 'utf8'),
) as {
  provenance: { chainId: string; consensus: string; coordinator: string; oracle: string }
  captures: Array<{
    epoch: string
    safeTxHash: Hex
    requestId: Hex
    groupKey: { x: string; y: string }
    logs: RawLog[]
  }>
}
const golden = { ...fixture.provenance, ...fixture.captures[0] }

// `|| undefined` so an empty string (a common way to "unset" in CI) still skips.
const RPC = process.env.SAFENET_IT_RPC || undefined

/** The captured `TransactionAttested` log, decoded by the production path. */
const goldenAttested = (): OracleAttestedEvent => {
  const attested = decodeLogs(golden.logs).find(
    (event): event is OracleAttestedEvent => event.type === CheckEventType.ORACLE_ATTESTED,
  )
  if (!attested) throw new Error('golden fixture carries no decodable TransactionAttested log')
  return attested
}

const makeReader = () =>
  new SafenetReader({
    rpcUrls: [RPC as string],
    chainId: golden.chainId,
    consensus: process.env.SAFENET_CONSENSUS ?? golden.consensus,
    coordinator: process.env.SAFENET_COORDINATOR ?? golden.coordinator,
    oracles: [process.env.SAFENET_ORACLE ?? golden.oracle],
  })

;(RPC ? describe : describe.skip)('SafenetReader integration — live network', () => {
  jest.setTimeout(30_000)

  it('loads the epoch group public key live and matches the golden vector', async () => {
    const key = await makeReader().loadGroupKey(golden.epoch)
    expect(key).toEqual(golden.groupKey)
  })

  it('verifies the real FROST attestation against the live group key (VERIFIED)', async () => {
    const result = await makeReader().verifyAttestation(goldenAttested())
    expect(result.status).toBe(AttestationVerificationStatus.VERIFIED)
  })

  it('derives the same requestId from the captured on-chain Proposed event', async () => {
    const capturedProposal = decodeLogs(golden.logs).find((event) => event.type === CheckEventType.ORACLE_PROPOSED)
    expect(capturedProposal).toBeDefined()
    const reader = makeReader()
    const timestampMs = await reader.blockTimeMs(capturedProposal!.blockNumber)
    expect(timestampMs).not.toBeNull()
    expect(timestampMs).toBeGreaterThan(0)
    const read = await reader.fetchCheckState(golden.safeTxHash, { timestampMs })
    expect(read.events).toContainEqual(capturedProposal)
    expect(read.requestId).toBe(golden.requestId)
  })
})
