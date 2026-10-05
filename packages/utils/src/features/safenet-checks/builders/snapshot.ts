import { faker } from '@faker-js/faker'
import { keccak256 } from 'ethers'
import {
  AttestationVerificationStatus,
  CheckStatus,
  UNVERIFIED_ATTESTATION,
  type Hex,
  type RequestSnapshot,
  type SafenetCheckSnapshot,
} from '../types'

const hexHash = (): Hex => faker.string.hexadecimal({ length: 64, prefix: '0x', casing: 'lower' }) as Hex

/** Faker builder for a {@link RequestSnapshot} — a fresh pending request with no votes. */
export const buildRequestSnapshot = (over: Partial<RequestSnapshot> = {}): RequestSnapshot => ({
  requestId: hexHash(),
  epoch: '1',
  oracle: faker.finance.ethereumAddress(),
  oracleDataHash: keccak256('0x') as Hex,
  chainId: '1',
  safe: faker.finance.ethereumAddress(),
  proposedAt: { blockNumber: 100, logIndex: 0, transactionHash: hexHash() },
  state: 'PENDING',
  outcome: 'PENDING',
  commitDeadlineBlock: '150',
  revealDeadlineBlock: '160',
  arbitrationDeadlineBlock: null,
  committedCount: 0,
  revealedCount: 0,
  approveCount: 0,
  denyCount: 0,
  votes: [],
  resolution: null,
  resolutionContext: null,
  resolutionTxHash: null,
  evidenceComplete: true,
  attestation: UNVERIFIED_ATTESTATION,
  attestedEvent: null,
  attestedAtMs: null,
  ...over,
})

/** Faker builder for a {@link SafenetCheckSnapshot} — all bigints as strings. */
export const buildSnapshot = (over: Partial<SafenetCheckSnapshot> = {}): SafenetCheckSnapshot => ({
  safeTxHash: hexHash(),
  chainId: '100',
  status: CheckStatus.SUBMITTED,
  outcome: null,
  requestId: null,
  epoch: null,
  oracle: null,
  deadlineBlock: null,
  headBlock: null,
  headAtMs: 1_785_749_900_000,
  observedAtMs: 1_785_749_901_000,
  attestation: UNVERIFIED_ATTESTATION,
  attestedAtMs: null,
  aimedAtMs: null,
  // The claim-gated default: a test asserting NO_CHECK must state the coverage
  // that licenses it.
  windowCoverage: 'heuristic',
  requests: [],
  evidenceComplete: false,
  events: [],
  ...over,
})

/** A snapshot in the terminal verified-BENIGN state, with its one approved request. */
export const buildBenignSnapshot = (over: Partial<SafenetCheckSnapshot> = {}): SafenetCheckSnapshot => {
  const attestation = { status: AttestationVerificationStatus.VERIFIED, signatureId: hexHash(), message: hexHash() }
  const request = buildRequestSnapshot({
    requestId: attestation.message,
    state: 'RESOLVED_APPROVED',
    outcome: 'APPROVED',
    committedCount: 2,
    revealedCount: 2,
    approveCount: 2,
    attestation,
    attestedAtMs: 1_785_749_985_000,
  })
  return buildSnapshot({
    status: CheckStatus.BENIGN,
    outcome: 'APPROVED',
    requestId: request.requestId,
    epoch: request.epoch,
    oracle: request.oracle,
    deadlineBlock: request.revealDeadlineBlock,
    attestedAtMs: request.attestedAtMs,
    attestation,
    requests: [request],
    evidenceComplete: true,
    ...over,
  })
}
