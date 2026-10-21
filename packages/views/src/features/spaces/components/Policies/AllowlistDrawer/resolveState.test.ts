import { MOCK_VIEWERS } from '@/features/spaces/components/Policies/mocks/policies'
import {
  mockActiveAllowlist,
  mockFullySignedPendingAllowlist,
  mockPendingAllowlist,
} from '@/features/spaces/components/Policies/mocks/allowlistPolicies'
import { resolveAllowlistDrawerState } from './resolveState'

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
})
