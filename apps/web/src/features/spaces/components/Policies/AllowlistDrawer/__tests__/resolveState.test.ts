import { MOCK_VIEWERS } from '../../mocks/policies'
import {
  mockActivatingAllowlist,
  mockActiveAllowlist,
  mockAllowlistChangePending,
  mockExpiredPendingAllowlist,
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
      helper: 'Connect a signer wallet to edit.',
    })
  })

  it('should disable editing for a wallet that is not a signer', () => {
    expect(resolveAllowlistDrawerState(mockActiveAllowlist(), MOCK_VIEWERS.nonSigner, 'Treasury')).toMatchObject({
      action: 'manage',
      disabled: true,
      helper: 'Only signers of this Safe account can edit this allowlist.',
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

  it.each([
    ['executed', 'The transaction was executed.', 'The allowlist becomes active after a delay of 10 minutes.'],
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

  it('should offer no action while a new allowlist waits out the delay', () => {
    expect(resolveAllowlistDrawerState(mockActivatingAllowlist(), MOCK_VIEWERS.signer, 'Treasury')).toEqual({
      kind: 'scheduled',
      operation: 'create',
      action: 'none',
      disabled: false,
      bannerTitle: 'Change pending',
      bannerLine2: "Until then, transactions aren't checked against it.",
    })
  })

  it.each([
    ['signer', MOCK_VIEWERS.signer, { action: 'cancel', disabled: false }],
    ['viewer without a wallet', MOCK_VIEWERS.disconnected, { action: 'connect', disabled: false }],
    ['wallet that is not a signer', MOCK_VIEWERS.nonSigner, { action: 'cancel', disabled: true }],
  ] as const)('should, for a %s, resolve the change waiting out the delay', (_, viewer, expected) => {
    expect(resolveAllowlistDrawerState(mockAllowlistChangePending(), viewer, 'Treasury')).toMatchObject({
      kind: 'scheduled',
      operation: 'update',
      ...expected,
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
