import { MOCK_ADDRESSES, asActivePolicy, mockPendingPolicy, mockSpendingLimitPolicy } from '../../mocks/policies'
import {
  formatOutstandingSignatures,
  getOutstandingSignatures,
  getPendingBannerDetail,
  getPendingBannerTitle,
  getPolicyPendingState,
} from '../policyPendingState'

describe('getPolicyPendingState', () => {
  it('should, when a signer has not yet signed, report that they still have to sign', () => {
    const policy = mockPendingPolicy({ missingSigners: [MOCK_ADDRESSES.bob] })

    expect(getPolicyPendingState(policy, MOCK_ADDRESSES.bob, true)).toBe('signer-not-signed')
  })

  it('should, when no wallet is connected, report the no-wallet state', () => {
    expect(getPolicyPendingState(mockPendingPolicy(), undefined, false)).toBe('no-wallet')
  })

  it('should, when the connected wallet is not a signer, report the not-signer state', () => {
    expect(getPolicyPendingState(mockPendingPolicy(), MOCK_ADDRESSES.unresolved, false)).toBe('not-signer')
  })

  it('should, when the signer has already signed and others have not, report that they are waiting', () => {
    const policy = mockPendingPolicy({ missingSigners: [MOCK_ADDRESSES.bob] })

    expect(getPolicyPendingState(policy, MOCK_ADDRESSES.alice, true)).toBe('signer-has-signed')
  })

  it('should, when every required signature is in, report the transaction as ready to execute', () => {
    const policy = mockPendingPolicy({ confirmationsSubmitted: 2, confirmationsRequired: 2, missingSigners: [] })

    expect(getPolicyPendingState(policy, MOCK_ADDRESSES.alice, true)).toBe('fully-signed')
  })

  it('should, when the queued transaction can no longer be used, report it as unavailable', () => {
    expect(getPolicyPendingState(mockPendingPolicy(), MOCK_ADDRESSES.alice, true, true)).toBe('unavailable')
  })

  it('should, when the signer address is written in a different case, still match the outstanding signers', () => {
    const policy = mockPendingPolicy({ missingSigners: [MOCK_ADDRESSES.bob.toUpperCase()] })

    expect(getPolicyPendingState(policy, MOCK_ADDRESSES.bob.toLowerCase(), true)).toBe('signer-not-signed')
  })
})

describe('getOutstandingSignatures', () => {
  it('should, when one of two signatures is in, report one signature outstanding', () => {
    expect(getOutstandingSignatures(mockPendingPolicy({ confirmationsSubmitted: 1, confirmationsRequired: 2 }))).toBe(1)
  })

  it('should, when one of four signatures is in, report three signatures outstanding', () => {
    expect(getOutstandingSignatures(mockPendingPolicy({ confirmationsSubmitted: 1, confirmationsRequired: 4 }))).toBe(3)
  })

  it('should, when more signatures are in than required, report none outstanding', () => {
    expect(getOutstandingSignatures(mockPendingPolicy({ confirmationsSubmitted: 3, confirmationsRequired: 2 }))).toBe(0)
  })
})

describe('formatOutstandingSignatures', () => {
  it('should, when one signature is outstanding, use the singular', () => {
    expect(formatOutstandingSignatures(1)).toBe('1 more signature')
  })

  it('should, when three signatures are outstanding, use the plural', () => {
    expect(formatOutstandingSignatures(3)).toBe('3 more signatures')
  })
})

describe('getPendingBannerTitle', () => {
  it('should, when the queued transaction creates the policy, say the policy is not active yet', () => {
    expect(getPendingBannerTitle(asActivePolicy(mockSpendingLimitPolicy()), 'create')).toBe(
      'The spending limit is not active as the transaction is not yet executed.',
    )
  })

  it('should, when the queued transaction removes the policy, say the policy is still active', () => {
    expect(getPendingBannerTitle(asActivePolicy(mockSpendingLimitPolicy()), 'remove')).toBe(
      'The spending limit stays active until the removal transaction is executed.',
    )
  })

  it('should, when the queued transaction changes the policy, say the current limits still apply', () => {
    expect(getPendingBannerTitle(asActivePolicy(mockSpendingLimitPolicy()), 'update')).toBe(
      'The spending limit keeps its current limits until the change is executed.',
    )
  })
})

describe('getPendingBannerDetail', () => {
  it('should, when the signer has not signed, ask them to sign and execute', () => {
    expect(getPendingBannerDetail('signer-not-signed', mockPendingPolicy())).toBe(
      'Sign and execute the transaction to activate.',
    )
  })

  it('should, when the signer has signed and one signature is outstanding, name that one signature', () => {
    const policy = mockPendingPolicy({ confirmationsSubmitted: 1, confirmationsRequired: 2 })

    expect(getPendingBannerDetail('signer-has-signed', policy)).toBe("You've signed. Waiting for 1 more signature.")
  })

  it('should, when the signer has signed and three signatures are outstanding, use the plural', () => {
    const policy = mockPendingPolicy({ confirmationsSubmitted: 1, confirmationsRequired: 4 })

    expect(getPendingBannerDetail('signer-has-signed', policy)).toBe("You've signed. Waiting for 3 more signatures.")
  })

  it('should, when every signature is in, ask for the transaction to be executed', () => {
    expect(getPendingBannerDetail('fully-signed', mockPendingPolicy())).toBe('Execute the transaction to activate.')
  })

  it('should, when the connected wallet is not a signer, say who can sign', () => {
    expect(getPendingBannerDetail('not-signer', mockPendingPolicy())).toBe(
      'Only signers of this Safe account can sign this transaction.',
    )
  })

  it('should, when no wallet is connected, give no second line', () => {
    expect(getPendingBannerDetail('no-wallet', mockPendingPolicy())).toBeNull()
  })
})
