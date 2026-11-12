import { keccak256, toBeHex } from 'ethers'
import {
  AttestationVerificationStatus,
  CheckStatus,
  UNVERIFIED_ATTESTATION,
  type Hex,
  type SafenetCheckSnapshot,
} from '../types'

// Every call gives a new hash, and the same sequence on every run (stories render these snapshots too)
let hashCounter = 0
const hexHash = (): Hex => keccak256(toBeHex(++hashCounter, 32)) as Hex

/** Builder for a {@link SafenetCheckSnapshot} — all bigints as strings. */
export const buildSnapshot = (over: Partial<SafenetCheckSnapshot> = {}): SafenetCheckSnapshot => ({
  safeTxHash: hexHash(),
  chainId: '100',
  status: CheckStatus.SUBMITTED,
  requestId: null,
  epoch: null,
  oracle: null,
  deadlineBlock: null,
  headBlock: null,
  attestation: UNVERIFIED_ATTESTATION,
  attestedAtMs: null,
  timedOutAtMs: null,
  aimedAtMs: null,
  // The claim-gated default: a test asserting NO_CHECK must state the coverage
  // that licenses it.
  windowCoverage: 'heuristic',
  events: [],
  ...over,
})

/** A snapshot in the terminal verified-BENIGN state. */
export const buildBenignSnapshot = (over: Partial<SafenetCheckSnapshot> = {}): SafenetCheckSnapshot =>
  buildSnapshot({
    status: CheckStatus.BENIGN,
    attestedAtMs: 1_785_749_985_000,
    attestation: { status: AttestationVerificationStatus.VERIFIED, signatureId: hexHash(), message: hexHash() },
    ...over,
  })
