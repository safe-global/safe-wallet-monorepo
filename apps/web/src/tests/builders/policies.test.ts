import { isAddress } from 'ethers'
import { PolicyType, type ActivePolicy } from '@safe-global/store/gateway/policies/types'
import {
  tokenInfoBuilder,
  policyContractsBuilder,
  spendingLimitPolicyBuilder,
  recoveryPolicyBuilder,
  tokenWithdrawPolicyBuilder,
  cosignerPolicyBuilder,
  availablePolicyBuilder,
} from './policies'

const isDecimalString = (v: string) => /^\d+$/.test(v)

describe('policy builders', () => {
  it('tokenInfoBuilder produces a valid token descriptor', () => {
    const token = tokenInfoBuilder().build()
    expect(isAddress(token.address)).toBe(true)
    expect(typeof token.symbol).toBe('string')
    expect([6, 8, 18]).toContain(token.decimals)
  })

  it('policyContractsBuilder produces two checksummed addresses', () => {
    const { policyContract, safePolicyGuard } = policyContractsBuilder().build()
    expect(isAddress(policyContract)).toBe(true)
    expect(isAddress(safePolicyGuard)).toBe(true)
  })

  it('spendingLimitPolicyBuilder: module-enforced + decimal-string wei amounts', () => {
    const p = spendingLimitPolicyBuilder().build()
    expect(p.type).toBe(PolicyType.SpendingLimit)
    expect(p.enforcement.via).toBe('module')
    if (p.enforcement.via === 'module') expect(isAddress(p.enforcement.moduleAddress)).toBe(true)
    expect(isAddress(p.data.beneficiary)).toBe(true)
    expect(p.data.limits.length).toBeGreaterThan(0)
    for (const l of p.data.limits) {
      expect(isDecimalString(l.amount)).toBe(true)
      expect(isDecimalString(l.spent)).toBe(true)
      expect(isAddress(l.token.address)).toBe(true)
    }
  })

  it('recoveryPolicyBuilder: module-enforced + decimal-string seconds', () => {
    const p = recoveryPolicyBuilder().build()
    expect(p.type).toBe(PolicyType.Recovery)
    expect(p.enforcement.via).toBe('module')
    if (p.enforcement.via === 'module') expect(isAddress(p.enforcement.moduleAddress)).toBe(true)
    expect(isDecimalString(p.data.cooldownSec)).toBe(true)
    expect(isDecimalString(p.data.expirySec)).toBe(true)
    expect(p.data.recoverers.every(isAddress)).toBe(true)
  })

  it('tokenWithdrawPolicyBuilder: guard-enforced allowlist with checksummed recipients', () => {
    const p = tokenWithdrawPolicyBuilder().build()
    expect(p.type).toBe(PolicyType.TokenWithdraw)
    expect(p.enforcement.via).toBe('guard')
    if (p.enforcement.via === 'guard') {
      expect(isAddress(p.enforcement.guards.transactionGuard!.policyContract)).toBe(true)
      expect(isAddress(p.enforcement.guards.transactionGuard!.safePolicyGuard)).toBe(true)
    }
    expect(p.data.allowlist.length).toBeGreaterThan(0)
    for (const entry of p.data.allowlist) {
      expect(isAddress(entry.token.address)).toBe(true)
      expect(entry.recipients.every((r) => isAddress(r.address))).toBe(true)
    }
  })

  it('cosignerPolicyBuilder: per-token rules with decimal-string threshold', () => {
    const p = cosignerPolicyBuilder().build()
    expect(p.type).toBe(PolicyType.Cosigner)
    for (const rule of p.data.rules) {
      expect(isAddress(rule.cosigner.address)).toBe(true)
      expect(isDecimalString(rule.thresholdAmount)).toBe(true)
    }
  })

  it('availablePolicyBuilder: catalogue entry with guard enforcement', () => {
    const a = availablePolicyBuilder().build()
    expect(Object.values(PolicyType)).toContain(a.type)
    expect(a.enforcement.via).toBe('guard')
    if (a.enforcement.via === 'guard') {
      expect(isAddress(a.enforcement.guards.transactionGuard!.policyContract)).toBe(true)
      expect(isAddress(a.enforcement.guards.transactionGuard!.safePolicyGuard)).toBe(true)
    }
    expect(a.configuredCount).toBeGreaterThanOrEqual(0)
  })
})

describe('ActivePolicy discriminated union narrows on `type`', () => {
  // This function only compiles if the union narrows correctly per discriminant;
  // the runtime assertions confirm the builders match those narrowed shapes.
  const describePolicy = (p: ActivePolicy): string => {
    switch (p.type) {
      case PolicyType.SpendingLimit:
        return `spender ${p.data.beneficiary}` // data.beneficiary only exists on this branch
      case PolicyType.Recovery:
        return `recoverers ${p.data.recoverers.length}`
      case PolicyType.TokenWithdraw:
        return `allowlist ${p.data.allowlist.length}` // data.allowlist only exists here
      case PolicyType.Cosigner:
        return `rules ${p.data.rules.length}`
    }
  }

  it('narrows each variant to its own data shape', () => {
    expect(describePolicy(spendingLimitPolicyBuilder().build())).toMatch(/^spender 0x/)
    expect(describePolicy(recoveryPolicyBuilder().build())).toMatch(/^recoverers \d+$/)
    expect(describePolicy(tokenWithdrawPolicyBuilder().build())).toMatch(/^allowlist \d+$/)
    expect(describePolicy(cosignerPolicyBuilder().build())).toMatch(/^rules \d+$/)
  })
})
