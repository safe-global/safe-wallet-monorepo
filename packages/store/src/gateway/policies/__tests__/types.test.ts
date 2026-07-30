import { PolicyType } from '../types'

describe('PolicyType (wire-format contract)', () => {
  it('values are the exact wire strings', () => {
    expect(PolicyType.SpendingLimit).toBe('spending-limit')
    expect(PolicyType.Recovery).toBe('recovery')
    expect(PolicyType.TokenWithdraw).toBe('ERC20TransferPolicy')
    expect(PolicyType.Cosigner).toBe('cosigner')
    expect(PolicyType.Allow).toBe('AllowPolicy')
    expect(PolicyType.NativeTransfer).toBe('NativeTransferPolicy')
    expect(PolicyType.Deny).toBe('DenyPolicy')
  })

  it('has exactly the known types', () => {
    expect(Object.values(PolicyType).sort()).toEqual([
      'AllowPolicy',
      'DenyPolicy',
      'ERC20TransferPolicy',
      'NativeTransferPolicy',
      'cosigner',
      'recovery',
      'spending-limit',
    ])
  })
})
