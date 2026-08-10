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
  safeTxHash: hexHash(),
  chainId: '100',
  status: CheckStatus.SUBMITTED,
  generation: null,
  requestId: null,
  epoch: null,
  oracle: null,
  deadlineBlock: null,
  headBlock: null,
  attestation: UNVERIFIED_ATTESTATION,
  events: [],
  ...over,
})

/** A snapshot in the terminal verified-BENIGN state. */
export const buildBenignSnapshot = (over: Partial<SafenetCheckSnapshot> = {}): SafenetCheckSnapshot =>
  buildSnapshot({
    status: CheckStatus.BENIGN,
    attestation: { status: AttestationVerificationStatus.VERIFIED, signatureId: hexHash(), message: hexHash() },
    ...over,
  })
