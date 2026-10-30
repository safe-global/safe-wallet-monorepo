import { MOCK_VIEWERS } from '../../mocks/policies'
import {
  mockActivatingAllowlist,
  mockActiveAllowlist,
  mockAllowlistAwaitingGuardRemoval,
  mockAllowlistChangePending,
  mockExpiredPendingAllowlist,
  mockExpiredRequestAllowlist,
  mockReadyToApplyAllowlist,
  mockFailedAllowlist,
  mockFullySignedPendingAllowlist,
  mockPendingAllowlist,
  mockUnenforcedAllowlist,
} from '../../mocks/allowlistPolicies'
import { inferAllowlistOutcome, resolveAllowlistDrawerState } from '../resolveState'

describe('resolveAllowlistDrawerState', () => {
  it('should let a signer manage an active allowlist', () => {
    expect(resolveAllowlistDrawerState(mockActiveAllowlist(), MOCK_VIEWERS.signer, 'Treasury')).toEqual({
      kind: 'active',
      action: 'manage',
      disabled: false,
    })
  })

  it('should ask a viewer without a wallet to connect one', () => {
    expect(resolveAllowlistDrawerState(mockActiveAllowlist(), MOCK_VIEWERS.disconnected, 'Treasury')).toMatchObject({
      action: 'connect',
      helper: 'Connect a signer wallet to remove this allowlist.',
    })
  })

  it('should disable removing, when the wallet is not a signer', () => {
    expect(resolveAllowlistDrawerState(mockActiveAllowlist(), MOCK_VIEWERS.nonSigner, 'Treasury')).toMatchObject({
      action: 'manage',
      disabled: true,
      helper: 'Only signers of this Safe account can remove this allowlist.',
    })
  })

  it('should let a signer remove the guard, when an applied removal waits for it', () => {
    expect(resolveAllowlistDrawerState(mockAllowlistAwaitingGuardRemoval(), MOCK_VIEWERS.signer, 'Treasury')).toEqual({
      kind: 'remove-guard',
      action: 'remove-guard',
      disabled: false,
      helper: 'Any signer can start this transaction.',
      bannerTitle: 'Your allowlist is removed',
      bannerLine2: "Remove the guard to finish. Until then, this Safe account can't send anything.",
    })
  })

  it('should ask to connect a signer wallet, when the guard waits to be removed and no wallet is connected', () => {
    expect(
      resolveAllowlistDrawerState(mockAllowlistAwaitingGuardRemoval(), MOCK_VIEWERS.disconnected, 'Treasury'),
    ).toMatchObject({ kind: 'remove-guard', action: 'connect', helper: 'Connect a signer wallet to remove the guard.' })
  })

  it('should disable removing the guard, when the wallet is not a signer', () => {
    expect(
      resolveAllowlistDrawerState(mockAllowlistAwaitingGuardRemoval(), MOCK_VIEWERS.nonSigner, 'Treasury'),
    ).toMatchObject({
      kind: 'remove-guard',
      action: 'remove-guard',
      disabled: true,
      helper: 'Only signers of this Safe account can remove the guard.',
    })
  })

  it.each([
    ['a signer', MOCK_VIEWERS.signer],
    ['a viewer without a wallet', MOCK_VIEWERS.disconnected],
  ])('should, for %s, report an unenforced allowlist with no action', (_, viewer) => {
    expect(resolveAllowlistDrawerState(mockUnenforcedAllowlist(), viewer, 'Treasury')).toEqual({
      kind: 'unenforced',
      action: 'none',
      bannerTitle: 'Safe policy guard removed',
      bannerLine2: 'Allowlist not applied as the guard is removed.',
    })
  })

  it('should show a change waiting out the delay even when the allowlist is not enforced', () => {
    const policy = { ...mockAllowlistChangePending(), enabled: false }

    expect(resolveAllowlistDrawerState(policy, MOCK_VIEWERS.signer, 'Treasury').kind).toBe('scheduled')
  })

  it('should send a signer who has not signed to review the transaction', () => {
    expect(resolveAllowlistDrawerState(mockPendingAllowlist(), MOCK_VIEWERS.signer, 'Payroll')).toEqual({
      kind: 'pending',
      operation: 'create',
      action: 'review',
      bannerTitle: 'The allowlist is not active as the transaction is not yet executed.',
      bannerLine2: 'Sign and execute the transaction to activate.',
      signed: 1,
      required: 2,
    })
  })

  it('should say the allowlist is removed and ask a signer to sign, when a batch that takes the guard off is queued', () => {
    const policy = mockPendingAllowlist({ operation: 'remove', removesGuard: true })

    expect(resolveAllowlistDrawerState(policy, MOCK_VIEWERS.signer, 'Payroll')).toMatchObject({
      kind: 'pending',
      action: 'review',
      bannerTitle: 'Your allowlist is removed',
      bannerLine2: 'Sign and execute the transaction to remove the guard.',
    })
  })

  it('should ask to execute the guard removal, when it has all its signatures', () => {
    const policy = mockPendingAllowlist({ operation: 'remove', removesGuard: true, confirmationsSubmitted: 2 })

    expect(resolveAllowlistDrawerState(policy, MOCK_VIEWERS.signer, 'Payroll')).toMatchObject({
      action: 'review',
      bannerLine2: 'Execute the transaction to remove the guard.',
    })
  })

  it('should say the guard is removed, when the guard removal executed', () => {
    const policy = mockPendingAllowlist({ operation: 'remove', removesGuard: true })

    expect(resolveAllowlistDrawerState(policy, MOCK_VIEWERS.signer, 'Payroll', 'executed')).toMatchObject({
      kind: 'closed',
      bannerLine2: 'The guard is removed. It can take a moment to show here.',
    })
  })

  it('should send a signer to review the transaction while it is not known whether they have signed', () => {
    const signer = { ...MOCK_VIEWERS.signer, hasSigned: undefined }

    expect(resolveAllowlistDrawerState(mockPendingAllowlist(), signer, 'Payroll')).toMatchObject({
      kind: 'pending',
      action: 'review',
    })
  })

  it('should offer the transaction link to a signer who has already signed', () => {
    expect(resolveAllowlistDrawerState(mockPendingAllowlist(), MOCK_VIEWERS.signerWhoSigned, 'Payroll')).toMatchObject({
      action: 'copy-link',
      bannerLine2: expect.stringMatching(/^You've signed\./),
    })
  })

  it('should offer the transaction link to a wallet that is not a signer', () => {
    expect(resolveAllowlistDrawerState(mockPendingAllowlist(), MOCK_VIEWERS.nonSigner, 'Payroll')).toMatchObject({
      action: 'copy-link',
    })
  })

  it('should name the Safe when asking a viewer without a wallet to connect a signer', () => {
    expect(resolveAllowlistDrawerState(mockPendingAllowlist(), MOCK_VIEWERS.disconnected, 'Payroll')).toMatchObject({
      action: 'connect',
      helper: 'Connect a signer wallet of Payroll to sign.',
    })
  })

  it('should let anyone execute a fully signed transaction', () => {
    expect(
      resolveAllowlistDrawerState(mockFullySignedPendingAllowlist(), MOCK_VIEWERS.nonSigner, 'Payroll'),
    ).toMatchObject({ action: 'review', bannerLine2: 'Execute the transaction to activate.' })
  })

  it('should say the allowlist is active, when an executed first setup applied its rules at once', () => {
    expect(
      resolveAllowlistDrawerState(
        { ...mockPendingAllowlist(), appliesOnExecution: true },
        MOCK_VIEWERS.signer,
        'Payroll',
        'executed',
      ),
    ).toMatchObject({
      kind: 'closed',
      bannerLine2: 'The allowlist is active now. It can take a moment to show here.',
    })
  })

  it('should say the given delay, when an executed transaction waits out the installed guard', () => {
    expect(
      resolveAllowlistDrawerState(mockPendingAllowlist(), MOCK_VIEWERS.signer, 'Payroll', 'executed', 0, '10 minutes'),
    ).toMatchObject({
      bannerLine2: 'After 10 minutes, a second transaction needs to be executed to activate the allowlist.',
    })
  })

  it.each([
    [
      'executed',
      'The transaction was executed.',
      'After 3 minutes, a second transaction needs to be executed to activate the allowlist.',
    ],
    [
      'failed',
      'The transaction failed and can no longer be executed.',
      'Close this panel to see the current policies.',
    ],
    ['deleted', 'The transaction was deleted.', 'Close this panel to see the current policies.'],
    [
      'replaced',
      'Another transaction used this nonce, so this one can no longer be executed.',
      'Close this panel to see the current policies.',
    ],
    ['expired', 'Transaction expired', 'It can no longer be signed. Set up the allowlist again to retry.'],
  ] as const)('should, once the transaction was %s, report it with no action', (outcome, bannerTitle, bannerLine2) => {
    expect(resolveAllowlistDrawerState(mockPendingAllowlist(), MOCK_VIEWERS.signer, 'Payroll', outcome)).toEqual({
      kind: 'closed',
      operation: 'create',
      action: 'none',
      bannerTitle,
      bannerLine2,
    })
  })

  it.each([
    ['a new allowlist', mockActivatingAllowlist(), 'create'],
    ['an edit', mockAllowlistChangePending(), 'update'],
  ] as const)('should offer a disabled apply while %s waits out the delay', (_, policy, operation) => {
    expect(resolveAllowlistDrawerState(policy, MOCK_VIEWERS.signer, 'Treasury')).toEqual({
      kind: 'scheduled',
      operation,
      action: 'apply-later',
      disabled: true,
    })
  })

  it.each([
    ['viewer without a wallet', MOCK_VIEWERS.disconnected],
    ['wallet that is not a signer', MOCK_VIEWERS.nonSigner],
  ])('should keep apply disabled for a %s while the delay runs', (_, viewer) => {
    expect(resolveAllowlistDrawerState(mockAllowlistChangePending(), viewer, 'Treasury')).toMatchObject({
      action: 'apply-later',
      disabled: true,
    })
  })

  it.each([
    [
      'signer',
      MOCK_VIEWERS.signer,
      { action: 'apply', disabled: false, helper: 'Any signer can start this transaction.' },
    ],
    [
      'viewer without a wallet',
      MOCK_VIEWERS.disconnected,
      { action: 'connect', disabled: false, helper: 'Connect a signer wallet to apply the allowlist.' },
    ],
    [
      'wallet that is not a signer',
      MOCK_VIEWERS.nonSigner,
      { action: 'apply', disabled: true, helper: 'Only signers of this Safe account can apply this allowlist.' },
    ],
  ] as const)('should, for a %s, resolve a request whose delay is over', (_, viewer, expected) => {
    expect(resolveAllowlistDrawerState(mockReadyToApplyAllowlist(), viewer, 'Treasury')).toEqual({
      kind: 'ready-to-apply',
      operation: 'create',
      ...expected,
    })
  })

  it('should let a signer apply a change to a live allowlist once its delay is over', () => {
    expect(
      resolveAllowlistDrawerState(mockReadyToApplyAllowlist('update'), MOCK_VIEWERS.signer, 'Treasury'),
    ).toMatchObject({
      kind: 'ready-to-apply',
      operation: 'update',
      action: 'apply',
    })
  })

  it.each([
    ['create', 'To use an allowlist, set it up again.'],
    ['update', 'To make these changes, edit the allowlist again.'],
  ] as const)('should offer to discard a %s request whose apply window closed', (operation, helper) => {
    expect(
      resolveAllowlistDrawerState(mockExpiredRequestAllowlist(operation), MOCK_VIEWERS.signer, 'Treasury'),
    ).toEqual({ kind: 'expired-request', operation, action: 'discard', helper })
  })

  it('should resolve the waiting state against the time passed in', () => {
    const policy = mockActivatingAllowlist()
    const afterDelay = (policy.scheduledChange!.appliesAt + 60) * 1_000

    expect(resolveAllowlistDrawerState(policy, MOCK_VIEWERS.signer, 'Treasury', undefined, afterDelay)).toMatchObject({
      kind: 'ready-to-apply',
    })
  })

  it('should report a failed policy as failed without an outcome passed in', () => {
    expect(resolveAllowlistDrawerState(mockFailedAllowlist(), MOCK_VIEWERS.signer, 'Payroll')).toMatchObject({
      kind: 'closed',
      action: 'none',
      bannerTitle: 'The transaction failed and can no longer be executed.',
    })
  })

  it('should close an expired pending transaction without an outcome passed in', () => {
    expect(resolveAllowlistDrawerState(mockExpiredPendingAllowlist(), MOCK_VIEWERS.signer, 'Payroll')).toMatchObject({
      kind: 'closed',
      action: 'none',
      bannerTitle: 'Transaction expired',
    })
  })
})

describe('inferAllowlistOutcome', () => {
  const NOW_MS = 1_792_584_000_000

  it('should read a failed status as failed', () => {
    expect(inferAllowlistOutcome(mockFailedAllowlist(), NOW_MS)).toBe('failed')
  })

  it('should read a pending transaction as expired once its signing window has closed', () => {
    expect(inferAllowlistOutcome(mockPendingAllowlist({ expiresAt: NOW_MS / 1_000 }), NOW_MS)).toBe('expired')
  })

  it('should infer nothing while the signing window is open or unknown', () => {
    expect(inferAllowlistOutcome(mockPendingAllowlist({ expiresAt: NOW_MS / 1_000 + 1 }), NOW_MS)).toBeUndefined()
    expect(inferAllowlistOutcome(mockPendingAllowlist({ expiresAt: undefined }), NOW_MS)).toBeUndefined()
    expect(inferAllowlistOutcome(mockActiveAllowlist(), NOW_MS)).toBeUndefined()
  })
})
