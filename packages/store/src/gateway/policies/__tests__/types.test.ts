import { PolicyType } from '../types'

describe('PolicyType (wire-format contract)', () => {
  // These are the values CGW filters and discriminates on; a rename is a breaking API change.
  it('values are the exact wire strings', () => {
    expect(PolicyType.SpendingLimit).toBe('spending-limit')
    expect(PolicyType.Recovery).toBe('recovery')
    expect(PolicyType.Proposer).toBe('proposer')
    expect(PolicyType.TokenWithdraw).toBe('erc20-transfer')
    expect(PolicyType.Cosigner).toBe('cosigner')
    expect(PolicyType.Allow).toBe('allow')
    expect(PolicyType.NativeTransfer).toBe('native-transfer')
    expect(PolicyType.Deny).toBe('deny')
  })

  // MultiSend is ours until CGW reports it; everything else must stay a subset of the
  // ActivePolicyDto enum, or `types` filtering 422s.
  it('is the CGW enum plus the client-side multisend type', () => {
    const CGW_ACTIVE_POLICY_TYPES = [
      'spending-limit',
      'recovery',
      'proposer',
      'erc20-transfer',
      'cosigner',
      'allow',
      'native-transfer',
      'deny',
    ]

    expect(Object.values(PolicyType).sort()).toEqual([...CGW_ACTIVE_POLICY_TYPES, 'multisend'].sort())
  })
})
