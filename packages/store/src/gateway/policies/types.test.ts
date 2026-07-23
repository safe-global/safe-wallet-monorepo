import { PolicyType, PolicyKind } from './types'

describe('policy enums (wire-format contract)', () => {
  it('PolicyType values are the exact wire strings', () => {
    expect(PolicyType.SpendingLimit).toBe('spending-limit')
    expect(PolicyType.Recovery).toBe('recovery')
    expect(PolicyType.TokenWithdraw).toBe('token-withdraw')
    expect(PolicyType.Cosigner).toBe('cosigner')
  })

  it('PolicyType has exactly the four known types', () => {
    expect(Object.values(PolicyType).sort()).toEqual(['cosigner', 'recovery', 'spending-limit', 'token-withdraw'])
  })

  it('PolicyKind values are the exact wire strings', () => {
    expect(PolicyKind.TransactionGuard).toBe('transaction-guard')
    expect(PolicyKind.ModuleGuard).toBe('module-guard')
  })

  it('PolicyKind has exactly the two guard kinds', () => {
    expect(Object.values(PolicyKind).sort()).toEqual(['module-guard', 'transaction-guard'])
  })
})
