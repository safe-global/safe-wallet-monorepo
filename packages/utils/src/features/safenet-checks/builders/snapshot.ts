import { faker } from '@faker-js/faker'
import {
  AttestationVerificationStatus,
  CheckStatus,
  UNVERIFIED_ATTESTATION,
  type Hex,
  type SafenetCheckSnapshot,
} from '../types'

const hexHash = (): Hex => faker.string.hexadecimal({ length: 64, prefix: '0x', casing: 'lower' }) as Hex

/** Faker builder for a {@link SafenetCheckSnapshot} — all bigints as strings. */
export const buildSnapshot = (over: Partial<SafenetCheckSnapshot> = {}): SafenetCheckSnapshot => ({
  safeTxHash: over.safeTxHash ?? hexHash(),
  chainId: over.chainId ?? '100',
  status: over.status ?? CheckStatus.SUBMITTED,
  generation: over.generation ?? null,
  requestId: over.requestId ?? null,
  epoch: over.epoch ?? null,
  oracle: over.oracle ?? null,
  deadlineBlock: over.deadlineBlock ?? null,
  headBlock: over.headBlock ?? null,
  attestation: over.attestation ?? UNVERIFIED_ATTESTATION,
  events: over.events ?? [],
})

/** A snapshot in the terminal verified-BENIGN state. */
export const buildBenignSnapshot = (over: Partial<SafenetCheckSnapshot> = {}): SafenetCheckSnapshot =>
  buildSnapshot({
    status: CheckStatus.BENIGN,
    attestation: { status: AttestationVerificationStatus.VERIFIED, signatureId: hexHash(), message: hexHash() },
    ...over,
  })
