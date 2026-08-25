import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { SafenetReader } from '../safenetReader'
import { decodeLogs, type RawLog } from '../../utils/decodeLogs'
import { AttestationVerificationStatus, CheckEventType, type Hex, type OracleAttestedEvent } from '../../types'

/**
 * Opt-in integration spec — runs only under `yarn test:integration` against a
 * live Safenet network. Defaults target the redeployed (2026-08-20) Sepolia
 * contracts the golden vector was captured from:
 *
 *   SAFENET_IT_RPC=https://ethereum-sepolia-rpc.publicnode.com \
 *     SAFENET_IT_CHAIN_ID=11155111 \
 *     yarn workspace @safe-global/utils test:integration
 *
 * Consensus / coordinator addresses and the single-entry oracle allowlist
 * default to the checked-in golden vector but can be overridden with
 * SAFENET_CONSENSUS / SAFENET_COORDINATOR / SAFENET_ORACLE.
 */
type Golden = {
  chainId: string
  consensus: string
  coordinator: string
  oracle: string
  epoch: string
  safeTxHash: Hex
  requestId: Hex
  signatureId: Hex
  oracleDataHash: Hex
  groupKey: { x: string; y: string }
  r: { x: string; y: string }
  z: string
  logs: RawLog[]
}

const golden: Golden = JSON.parse(
  readFileSync(join(__dirname, '../../__fixtures__/sepolia-relaunch-attestation.golden.json'), 'utf8'),
)

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
    chainId: process.env.SAFENET_IT_CHAIN_ID ?? golden.chainId,
    consensus: process.env.SAFENET_CONSENSUS ?? golden.consensus,
    coordinator: process.env.SAFENET_COORDINATOR ?? golden.coordinator,
    oracles: [process.env.SAFENET_ORACLE ?? golden.oracle],
  })

if (!RPC) {
  describe('SafenetReader integration (skipped)', () => {
    it('requires SAFENET_IT_RPC — set it to run against a live network', () => {
      console.warn(
        '[safenet integration] SAFENET_IT_RPC unset — skipping live checks. Run:\n' +
          '  SAFENET_IT_RPC=http://127.0.0.1:8547 SAFENET_IT_CHAIN_ID=31337 ' +
          'yarn workspace @safe-global/utils test:integration',
      )
      expect(RPC).toBeUndefined()
    })
  })
} else {
  describe('SafenetReader integration — live network', () => {
    jest.setTimeout(30_000)

    it('loads the epoch group public key live and matches the golden vector', async () => {
      const key = await makeReader().loadGroupKey(golden.epoch)
      expect(key).toEqual(golden.groupKey)
    })

    it('verifies the real FROST attestation against the live group key (VERIFIED)', async () => {
      const result = await makeReader().verifyAttestation(goldenAttested())
      expect(result.status).toBe(AttestationVerificationStatus.VERIFIED)
    })

    it('derives the same requestId from the on-chain Proposed event (when in lookback range)', async () => {
      const read = await makeReader().fetchCheckState(golden.safeTxHash)
      const proposed = read.events.find((event) => event.type === CheckEventType.ORACLE_PROPOSED)
      if (!proposed) {
        console.warn('[safenet integration] Proposed event outside the lookback window — skipping requestId equality')
        return
      }
      expect(read.requestId).toBe(golden.requestId)
    })
  })
}
