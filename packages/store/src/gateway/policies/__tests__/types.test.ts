import { PolicyType } from '../types'

describe('PolicyType (wire-format contract)', () => {
  it('values are the exact wire strings', () => {
    expect(PolicyType.SpendingLimit).toBe('spending-limit')
    expect(PolicyType.Recovery).toBe('recovery')
    expect(PolicyType.TokenWithdraw).toBe('ERC20TransferPolicy')
    expect(PolicyType.Cosigner).toBe('cosigner')
  })

  it('has exactly the four known types', () => {
    expect(Object.values(PolicyType).sort()).toEqual(['ERC20TransferPolicy', 'cosigner', 'recovery', 'spending-limit'])
  })
})
