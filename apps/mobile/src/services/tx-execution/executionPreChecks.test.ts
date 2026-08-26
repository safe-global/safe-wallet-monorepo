import { getContractErrorMessage, getGs026Message } from '@safe-global/utils/services/exceptions/contractErrors'
import { ExecutionError } from './executionErrors'
import { getMissingSignaturesError } from './executionPreChecks'

const OWNER_A = '0xAAaAaA2A6E1B1c2d3E4f5061728394A5b6C7d8E9'
const OWNER_B = '0xBbBBbB2A6E1B1c2d3E4f5061728394A5b6C7d8E9'
const OUTSIDER = '0xCcCcCc2A6E1B1c2d3E4f5061728394A5b6C7d8E9'
const OWNERS = [OWNER_A, OWNER_B]

describe('getMissingSignaturesError', () => {
  it('allows execution once the threshold is met', () => {
    expect(
      getMissingSignaturesError({
        confirmedSigners: [OWNER_A, OWNER_B],
        threshold: 2,
        owners: OWNERS,
        executorAddress: OWNER_A,
      }),
    ).toBeUndefined()
  })

  it('allows a signer executor to cover the last confirmation with its pre-validated signature', () => {
    expect(
      getMissingSignaturesError({
        confirmedSigners: [OWNER_A],
        threshold: 2,
        owners: OWNERS,
        executorAddress: OWNER_B,
      }),
    ).toBeUndefined()
  })

  it('does not count a signer executor twice when it already confirmed', () => {
    const result = getMissingSignaturesError({
      confirmedSigners: [OWNER_A],
      threshold: 2,
      owners: OWNERS,
      executorAddress: OWNER_A,
    })

    expect(result).toBeInstanceOf(ExecutionError)
    expect(result?.message).toBe(getContractErrorMessage('GS025'))
    expect(result?.code).toBe('GS025')
  })

  it('blocks a non-signer executor with the invalid-signer message', () => {
    const result = getMissingSignaturesError({
      confirmedSigners: [OWNER_A],
      threshold: 2,
      owners: OWNERS,
      executorAddress: OUTSIDER,
    })

    expect(result?.message).toBe(getGs026Message('NOT_SIGNER'))
    expect(result?.code).toBe('GS026')
  })

  it('blocks a relayed execution that is short of confirmations', () => {
    const result = getMissingSignaturesError({
      confirmedSigners: [OWNER_A],
      threshold: 2,
      owners: OWNERS,
      executorAddress: undefined,
    })

    expect(result?.message).toBe(getContractErrorMessage('GS025'))
  })

  it('allows a relayed execution once the threshold is met', () => {
    expect(
      getMissingSignaturesError({
        confirmedSigners: [OWNER_A, OWNER_B],
        threshold: 2,
        owners: OWNERS,
        executorAddress: undefined,
      }),
    ).toBeUndefined()
  })

  it('matches signers case-insensitively', () => {
    expect(
      getMissingSignaturesError({
        confirmedSigners: [OWNER_A.toLowerCase()],
        threshold: 2,
        owners: OWNERS.map((owner) => owner.toLowerCase()),
        executorAddress: OWNER_B.toUpperCase(),
      }),
    ).toBeUndefined()
  })

  it('blocks a Safe with zero confirmations and no signer executor', () => {
    const result = getMissingSignaturesError({
      confirmedSigners: [],
      threshold: 1,
      owners: OWNERS,
      executorAddress: OUTSIDER,
    })

    expect(result?.message).toBe(getGs026Message('NOT_SIGNER'))
  })

  it('does not block while the Safe info is still loading', () => {
    expect(
      getMissingSignaturesError({ confirmedSigners: [], threshold: undefined, owners: [], executorAddress: OWNER_A }),
    ).toBeUndefined()
    expect(
      getMissingSignaturesError({ confirmedSigners: [], threshold: 0, owners: [], executorAddress: OWNER_A }),
    ).toBeUndefined()
  })

  it('does not block when the confirmations are unknown', () => {
    // "Unknown" is not "none": a caller that cannot resolve the confirmations
    // must not have a fully confirmed transaction blocked.
    expect(
      getMissingSignaturesError({
        confirmedSigners: undefined,
        threshold: 2,
        owners: OWNERS,
        executorAddress: OWNER_A,
      }),
    ).toBeUndefined()
    expect(
      getMissingSignaturesError({
        confirmedSigners: undefined,
        threshold: 2,
        owners: OWNERS,
        executorAddress: undefined,
      }),
    ).toBeUndefined()
  })

  it('never surfaces technical content', () => {
    const messages = [
      getMissingSignaturesError({
        confirmedSigners: [],
        threshold: 2,
        owners: OWNERS,
        executorAddress: OUTSIDER,
      })?.message,
      getMissingSignaturesError({
        confirmedSigners: [],
        threshold: 2,
        owners: OWNERS,
        executorAddress: undefined,
      })?.message,
    ]

    for (const message of messages) {
      expect(message).toBeDefined()
      expect(message).not.toMatch(/GS\d{3}/)
      expect(message).not.toMatch(/0x[0-9a-f]{4,}/i)
      expect(message).not.toMatch(/execTransaction/)
      expect(message).not.toMatch(/\b(viem|ethers|sdk)\b/i)
      expect(message).not.toContain('!')
    }
  })
})
