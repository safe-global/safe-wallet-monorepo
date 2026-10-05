import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { Contract, JsonRpcProvider } from 'ethers'
import { ORACLE_READ_ABI } from '../../abi'
import { SafenetReader, type CheckReadResult } from '../safenetReader'
import {
  AttestationVerificationStatus,
  CheckEventType,
  type CheckEventBase,
  type Hex,
  type OracleAttestedEvent,
  type OracleRequestState,
  type RequestRead,
} from '../../types'

/**
 * Opt-in live suite for `yarn test:integration`: reads the checks captured in `gnosis-aegis.json`
 * back from the Gnosis test deployment. Skipped unless SAFENET_IT_RPC names a Gnosis Chain RPC; once
 * set, an RPC failure or an absent historical request fails the run.
 *
 *   SAFENET_IT_RPC=https://rpc.gnosischain.com yarn workspace @safe-global/utils test:integration
 */

type Capture = Pick<RequestRead, 'requestId' | 'epoch' | 'safe'> & {
  label: string
  safeTxHash: Hex
  homeChainId: string
  timestampMs: number
  proposal: CheckEventBase
  attestation: { signatureId: Hex } | null
  groupKey: { x: string; y: string } | null
  expected: Pick<RequestRead, 'state' | 'outcome' | 'committedCount' | 'revealedCount' | 'approveCount' | 'denyCount'>
}

const { provenance, captures }: { provenance: Record<string, string>; captures: Capture[] } = JSON.parse(
  readFileSync(join(__dirname, '../../__fixtures__/gnosis-aegis.json'), 'utf8'),
)

const approved = captures.filter((capture) => capture.attestation)

// `|| ''` so an empty string (a common way to "unset" in CI) still skips.
const RPC = process.env.SAFENET_IT_RPC || ''
const CHAIN_ID = process.env.SAFENET_IT_CHAIN_ID ?? provenance.chainId
const describeLive = RPC ? describe : describe.skip

jest.setTimeout(60_000)

const reader = new SafenetReader({
  rpcUrls: [RPC],
  chainId: CHAIN_ID,
  consensus: provenance.consensus,
  coordinator: provenance.coordinator,
  oracles: [provenance.oracle],
})

const reads = new Map<string, Promise<CheckReadResult>>()

const liveRead = (capture: Capture): Promise<CheckReadResult> => {
  const cached = reads.get(capture.label)
  if (cached) return cached
  const pending = reader.fetchCheckState(capture.safeTxHash, {
    target: { chainId: capture.homeChainId, safeAddress: capture.safe },
    timestampMs: capture.timestampMs,
  })
  reads.set(capture.label, pending)
  return pending
}

const liveRequest = async (capture: Capture): Promise<RequestRead> => {
  const request = (await liveRead(capture)).requests.find(({ requestId }) => requestId === capture.requestId)
  if (!request) throw new Error(`live read of ${capture.label} returned no request ${capture.requestId}`)
  return request
}

/** Indexed by the ABI state ordinal minus one. */
const ORACLE_STATES: OracleRequestState[] = ['PENDING', 'FROZEN', 'RESOLVED_APPROVED', 'RESOLVED_DENIED', 'TIMED_OUT']

const readDirect = async (requestId: Hex, blockTag: number) => {
  const provider = new JsonRpcProvider(RPC, Number(CHAIN_ID), { staticNetwork: true })
  try {
    const oracle = new Contract(provenance.oracle, [...ORACLE_READ_ABI], provider)
    const { terms, progress } = await oracle.getRequest(requestId, { blockTag })
    return {
      state: ORACLE_STATES[Number(progress.state) - 1],
      commitDeadlineBlock: terms.commitDeadline.toString(),
      revealDeadlineBlock: terms.revealDeadline.toString(),
      arbitrationDeadlineBlock: progress.arbitrationDeadline === 0n ? null : progress.arbitrationDeadline.toString(),
      committedCount: Number(progress.committedCount),
      revealedCount: Number(progress.revealedCount),
      approveCount: Number(progress.approveSentinelCount),
      denyCount: Number(progress.denySentinelCount),
    }
  } finally {
    provider.destroy()
  }
}

describeLive('SafenetReader integration — Gnosis test deployment', () => {
  it.each(approved)('loads the live epoch group key of $label, equal to the captured key', async (capture) => {
    expect(await reader.loadGroupKey(capture.epoch)).toEqual(capture.groupKey)
  })

  it.each(approved)('reads $label as the settled request with the captured state and counts', async (capture) => {
    const { state, outcome, committedCount, revealedCount, approveCount, denyCount } = capture.expected

    expect(await liveRequest(capture)).toMatchObject({
      proposedAt: capture.proposal,
      state,
      outcome,
      committedCount,
      revealedCount,
      approveCount,
      denyCount,
    })
  })

  it.each(captures)('reads $label exactly as the Oracle getter does at the same head', async (capture) => {
    const direct = await readDirect(capture.requestId, Number((await liveRead(capture)).headBlock))

    expect(await liveRequest(capture)).toMatchObject({ ...direct, proposedAt: capture.proposal })
  })

  it.each(captures)('derives the votes of $label from the live Oracle logs', async (capture) => {
    const { votes } = await liveRequest(capture)
    const { committedCount, approveCount, denyCount } = capture.expected

    expect(votes).toHaveLength(committedCount)
    expect(votes.filter(({ approved }) => approved === true)).toHaveLength(approveCount)
    expect(votes.filter(({ approved }) => approved === false)).toHaveLength(denyCount)
  })

  it.each(approved)('verifies the live attestation of $label against the live group key', async (capture) => {
    const { events } = await liveRead(capture)
    const attested = events.find((event): event is OracleAttestedEvent => event.type === CheckEventType.ORACLE_ATTESTED)

    expect(attested?.signatureId).toBe(capture.attestation?.signatureId)
    expect(await reader.verifyAttestation(attested as OracleAttestedEvent)).toEqual({
      status: AttestationVerificationStatus.VERIFIED,
      signatureId: capture.attestation?.signatureId,
      message: capture.requestId,
    })
  })
})
