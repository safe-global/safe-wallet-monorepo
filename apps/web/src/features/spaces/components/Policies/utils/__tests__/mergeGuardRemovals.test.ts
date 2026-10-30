import type { PendingGuardInstallationDto } from '@safe-global/store/gateway/AUTO_GENERATED/spaces'
import { MOCK_SAFES } from '../../mocks/policies'
import { mockActiveAllowlist, mockAllowlistAwaitingGuardRemoval } from '../../mocks/allowlistPolicies'
import { mergeGuardRemovals } from '../mergeGuardRemovals'

const POLICY_GUARD = '0x4d1fB05cc9bcd31cCA651B2833b4E71229c31d1f'
const OTHER_GUARD = '0x9b3e4d2C1a0F8e7D6c5B4a3928170F6e5D4c3B2a'
const SAFE_TX_HASH = '0x5d6e7f8091a2b3c4d5e6f708192a3b4c5d6e7f8091a2b3c4d5e6f708192a3b4c'

const TAKES_GUARD_OFF: PendingGuardInstallationDto['changes'] = [
  { kind: 'set-guard', from: POLICY_GUARD, to: null },
  { kind: 'set-module-guard', from: POLICY_GUARD, to: null },
]

const guardInstallation = (
  changes: PendingGuardInstallationDto['changes'],
  safe: PendingGuardInstallationDto['safe'] = MOCK_SAFES.treasury,
): PendingGuardInstallationDto => ({
  kind: 'guard-installation',
  status: 'in-signing',
  safe,
  changes,
  transaction: {
    safeTxHash: SAFE_TX_HASH,
    nonce: 7,
    confirmations: 1,
    confirmationsRequired: 2,
    proposedAt: 1_800_000_000,
    proposer: null,
  },
})

describe('mergeGuardRemovals', () => {
  it('should replace the blocking allowlist with a pending row of the queued removal, when a batch takes the policy guard off', () => {
    const blocking = mockAllowlistAwaitingGuardRemoval()

    const merged = mergeGuardRemovals([guardInstallation(TAKES_GUARD_OFF)], [blocking])

    expect(merged).toEqual([
      expect.objectContaining({
        safe: blocking.safe,
        status: 'pending',
        operation: 'remove',
        removesGuard: true,
        data: { entries: [] },
        enforcement: { via: 'guard', guardAddress: POLICY_GUARD },
        safeTxHash: SAFE_TX_HASH,
        confirmationsSubmitted: 1,
        confirmationsRequired: 2,
      }),
    ])
  })

  it('should keep the blocking allowlist, when the queued batch installs the policy guard', () => {
    const blocking = mockAllowlistAwaitingGuardRemoval()

    const merged = mergeGuardRemovals(
      [guardInstallation([{ kind: 'set-guard', from: null, to: POLICY_GUARD }])],
      [blocking],
    )

    expect(merged).toEqual([blocking])
  })

  it('should keep the blocking allowlist, when the guard the batch takes off is not a policy guard', () => {
    const blocking = mockAllowlistAwaitingGuardRemoval()

    const merged = mergeGuardRemovals(
      [guardInstallation([{ kind: 'set-guard', from: OTHER_GUARD, to: null }])],
      [blocking],
    )

    expect(merged).toEqual([blocking])
  })

  it('should keep the blocking allowlist, when the removal is queued on another Safe', () => {
    const blocking = mockAllowlistAwaitingGuardRemoval()

    const merged = mergeGuardRemovals([guardInstallation(TAKES_GUARD_OFF, MOCK_SAFES.payroll)], [blocking])

    expect(merged).toEqual([blocking])
  })

  it('should add no row, when the Safe whose guard comes off still has an allowlist with rules', () => {
    const active = mockActiveAllowlist()

    expect(mergeGuardRemovals([guardInstallation(TAKES_GUARD_OFF)], [active])).toEqual([active])
  })
})
