import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { Contract, Interface, JsonRpcProvider, type Result } from 'ethers'
import { ORACLE_READ_ABI } from '../../abi'
import { SAFENET_DEPLOYMENT } from '../../constants'
import { requestOutcome } from '../../utils/requestOutcome'
import { SafenetReader, type CheckReadResult } from '../safenetReader'
import {
  AttestationVerificationStatus,
  type AttestationCandidate,
  type Hex,
  type OracleRequestState,
  type RequestOutcome,
  type RequestRead,
  type RequestRef,
} from '../../types'

/**
 * Opt-in live suite for `yarn test:integration`, run against the pinned Gnosis
 * deployment. Skipped unless SAFENET_IT_RPC names a Gnosis Chain (100) RPC; once
 * set, an RPC failure or an absent historical request fails the run.
 *
 *   SAFENET_IT_RPC=https://rpc.gnosischain.com yarn workspace @safe-global/utils test:integration
 */

type Point = { x: string; y: string }

type Capture = {
  label: string
  kind: 'attested' | 'disputed'
  safeTxHash: Hex
  homeChainId: string
  safe: string
  timestampMs: number
  epoch: string
  requestId: Hex
  oracleDataHash: Hex
  proposal: NonNullable<RequestRef['proposedAt']>
  attestation: { signatureId: Hex } | null
  groupKey: Point | null
  requestState: { blockNumber: number; rawResult: string }
  expected: {
    state: OracleRequestState
    outcome: RequestOutcome
    committedCount: number
    revealedCount: number
    approveCount: number
    denyCount: number
  }
}

type Approved = Capture & { attestation: NonNullable<Capture['attestation']>; groupKey: Point }

type DirectRequest = Pick<
  RequestRead,
  | 'state'
  | 'committedCount'
  | 'revealedCount'
  | 'approveCount'
  | 'denyCount'
  | 'commitDeadlineBlock'
  | 'revealDeadlineBlock'
  | 'arbitrationDeadlineBlock'
>

const fixture: { provenance: { oracle: string }; captures: Capture[] } = JSON.parse(
  readFileSync(join(__dirname, '../../__fixtures__/gnosis-aegis.json'), 'utf8'),
)

const asApproved = (capture: Capture): Approved => {
  if (!capture.attestation || !capture.groupKey) {
    throw new Error(`fixture capture ${capture.label} carries no attestation`)
  }
  return { ...capture, attestation: capture.attestation, groupKey: capture.groupKey }
}

const approvedCaptures = fixture.captures.filter((capture) => capture.kind === 'attested').map(asApproved)
const disputedCaptures = fixture.captures.filter((capture) => capture.kind === 'disputed')

// `|| ''` so an empty string (a common way to "unset" in CI) still skips.
const RPC = process.env.SAFENET_IT_RPC || ''
const describeLive = RPC ? describe : describe.skip

jest.setTimeout(60_000)

const reader = new SafenetReader({
  rpcUrls: [RPC],
  chainId: SAFENET_DEPLOYMENT.chainId,
  consensus: SAFENET_DEPLOYMENT.consensus,
  coordinator: SAFENET_DEPLOYMENT.coordinator,
  oracles: [...SAFENET_DEPLOYMENT.oracles],
})

const knownRef = (capture: Capture): RequestRef => ({
  requestId: capture.requestId,
  epoch: capture.epoch,
  oracle: fixture.provenance.oracle,
  oracleDataHash: capture.oracleDataHash,
  chainId: capture.homeChainId,
  safe: capture.safe,
  proposedAt: capture.proposal,
})

const reads = new Map<string, Promise<CheckReadResult>>()

const liveRead = (capture: Capture): Promise<CheckReadResult> => {
  const cached = reads.get(capture.label)
  if (cached) return cached
  const pending = reader.fetchCheckState(capture.safeTxHash, {
    target: { chainId: capture.homeChainId, safeAddress: capture.safe },
    timestampMs: capture.timestampMs,
    knownRequests: [knownRef(capture)],
  })
  reads.set(capture.label, pending)
  return pending
}

const requestOf = (read: CheckReadResult, capture: Capture): RequestRead => {
  const request = read.requests.find((entry) => entry.requestId === capture.requestId)
  if (!request) throw new Error(`live read of ${capture.label} returned no request ${capture.requestId}`)
  return request
}

const candidateOf = (read: CheckReadResult, capture: Capture): AttestationCandidate => {
  const candidate = read.candidates.find((entry) => entry.requestId === capture.requestId)
  if (!candidate) throw new Error(`live read of ${capture.label} returned no attestation candidate`)
  return candidate
}

const ORACLE_STATES: Record<number, OracleRequestState> = {
  1: 'PENDING',
  2: 'FROZEN',
  3: 'RESOLVED_APPROVED',
  4: 'RESOLVED_DENIED',
  5: 'TIMED_OUT',
}

const toDirect = (request: Result): DirectRequest => {
  const state = ORACLE_STATES[Number(request.progress.state)]
  if (!state) throw new Error(`Oracle getter returned unknown state ${request.progress.state}`)
  const arbitrationDeadline: bigint = request.progress.arbitrationDeadline
  return {
    state,
    committedCount: Number(request.progress.committedCount),
    revealedCount: Number(request.progress.revealedCount),
    approveCount: Number(request.progress.approveSentinelCount),
    denyCount: Number(request.progress.denySentinelCount),
    commitDeadlineBlock: request.terms.commitDeadline.toString(),
    revealDeadlineBlock: request.terms.revealDeadline.toString(),
    arbitrationDeadlineBlock: arbitrationDeadline === 0n ? null : arbitrationDeadline.toString(),
  }
}

const readDirect = async (requestId: Hex, blockTag: number): Promise<DirectRequest> => {
  const provider = new JsonRpcProvider(RPC, Number(SAFENET_DEPLOYMENT.chainId), { staticNetwork: true })
  try {
    const oracle = new Contract(fixture.provenance.oracle, [...ORACLE_READ_ABI], provider)
    return toDirect(await oracle.getRequest(requestId, { blockTag }))
  } finally {
    provider.destroy()
  }
}

const capturedRequest = (capture: Capture): DirectRequest =>
  toDirect(new Interface([...ORACLE_READ_ABI]).decodeFunctionResult('getRequest', capture.requestState.rawResult)[0])

describeLive('SafenetReader integration — latest Gnosis deployment', () => {
  it.each(approvedCaptures)('loads the live epoch group key of $label, equal to the captured key', async (capture) => {
    expect(await reader.loadGroupKey(capture.epoch)).toEqual(capture.groupKey)
  })

  it.each(fixture.captures)('observes a head at or past the block $label was captured at', async (capture) => {
    const read = await liveRead(capture)

    expect(Number(read.headBlock)).toBeGreaterThanOrEqual(capture.requestState.blockNumber)
  })

  it.each(fixture.captures)('reads the request terms of $label as the captured getter holds them', async (capture) => {
    const { commitDeadlineBlock, revealDeadlineBlock } = capturedRequest(capture)

    const request = requestOf(await liveRead(capture), capture)

    expect(request).toMatchObject({ commitDeadlineBlock, revealDeadlineBlock })
  })

  it.each(approvedCaptures)('reads $label as the settled APPROVED request with captured counts', async (capture) => {
    const { state, outcome, committedCount, revealedCount, approveCount, denyCount } = capture.expected

    const request = requestOf(await liveRead(capture), capture)

    expect(request).toMatchObject({
      requestId: capture.requestId,
      proposedAt: capture.proposal,
      state,
      outcome,
      committedCount,
      revealedCount,
      approveCount,
      denyCount,
    })
  })

  it.each(approvedCaptures)('yields the real attestation of $label and verifies it live', async (capture) => {
    const candidate = candidateOf(await liveRead(capture), capture)

    const result = await reader.verifyAttestation(candidate.input)

    expect(candidate.input.signatureId).toBe(capture.attestation.signatureId)
    expect(result).toEqual({
      status: AttestationVerificationStatus.VERIFIED,
      signatureId: capture.attestation.signatureId,
      message: capture.requestId,
    })
  })

  it.each(disputedCaptures)('reads $label exactly as the Oracle getter does at the same head', async (capture) => {
    const read = await liveRead(capture)
    const direct = await readDirect(capture.requestId, Number(read.headBlock))

    expect(requestOf(read, capture)).toMatchObject({
      ...direct,
      outcome: requestOutcome(direct),
      proposedAt: capture.proposal,
    })
  })

  it.each(disputedCaptures)('reads $label as DISPUTED only while the Oracle holds it FROZEN', async (capture) => {
    const request = requestOf(await liveRead(capture), capture)

    expect(request.outcome === 'DISPUTED').toBe(request.state === 'FROZEN')
  })
})
