import { PolicyType } from '../types'

describe('PolicyType (wire-format contract)', () => {
  it('values are the exact wire strings', () => {
    expect(PolicyType.SpendingLimit).toBe('spending-limit')
    expect(PolicyType.Recovery).toBe('recovery')
    expect(PolicyType.TokenWithdraw).toBe('token-withdraw')
    expect(PolicyType.Cosigner).toBe('cosigner')
  })

  it('has exactly the four known types', () => {
    expect(Object.values(PolicyType).sort()).toEqual(['cosigner', 'recovery', 'spending-limit', 'token-withdraw'])
  })
})
