import { isAddress } from 'ethers'
import { PolicyType, type ActivePolicy } from '@safe-global/store/gateway/policies/types'
import {
  tokenInfoBuilder,
  policyContractsBuilder,
  spendingLimitPolicyBuilder,
  recoveryPolicyBuilder,
  tokenWithdrawPolicyBuilder,
  cosignerPolicyBuilder,
  allowPolicyBuilder,
  availablePolicyBuilder,
  pendingPolicyBuilder,
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
    expect(isAddress(p.data.module)).toBe(true)
    expect(p.data.spenders.length).toBeGreaterThan(0)
    for (const spender of p.data.spenders) {
      expect(isAddress(spender.spender)).toBe(true)
      for (const allowance of spender.allowances) {
        expect(isDecimalString(allowance.amount)).toBe(true)
        expect(isDecimalString(allowance.spent)).toBe(true)
        expect(isAddress(allowance.tokenAddress)).toBe(true)
      }
    }
  })

  it('recoveryPolicyBuilder: module-enforced + decimal-string seconds', () => {
    const p = recoveryPolicyBuilder().build()
    expect(p.type).toBe(PolicyType.Recovery)
    expect(p.enforcement.via).toBe('module')
    if (p.enforcement.via === 'module') expect(isAddress(p.enforcement.moduleAddress)).toBe(true)
    expect(isDecimalString(p.data.cooldownSec ?? '')).toBe(true)
    expect(isDecimalString(p.data.expirySec ?? '')).toBe(true)
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
      expect(isAddress(entry.tokenAddress)).toBe(true)
      expect(entry.recipients.every((r) => isAddress(r.account))).toBe(true)
    }
  })

  // The wire carries one cosigner address, snake-cased, and nothing else.
  it('cosignerPolicyBuilder: a single cosigner address', () => {
    const p = cosignerPolicyBuilder().build()
    expect(p.type).toBe(PolicyType.Cosigner)
    expect(isAddress(p.data.cosignerAddress)).toBe(true)
  })

  it('allowPolicyBuilder: the catch-all entry carries no data', () => {
    const p = allowPolicyBuilder().build()
    expect(p.type).toBe(PolicyType.Allow)
    expect(p.data).toEqual({})
    // No access id on the wire; the Safe it applies to is what identifies it.
    expect(isAddress(p.safe.address)).toBe(true)
  })

  it('availablePolicyBuilder: catalogue entry with guard enforcement', () => {
    const a = availablePolicyBuilder().build()
    expect(Object.values(PolicyType)).toContain(a.type)
    expect(a.enforcement?.via).toBe('guard')
    if (a.enforcement?.via === 'guard') {
      expect(isAddress(a.enforcement.guards.transactionGuard!.policyContract)).toBe(true)
      expect(isAddress(a.enforcement.guards.transactionGuard!.safePolicyGuard)).toBe(true)
    }
    expect(a.configuredCount).toBeGreaterThanOrEqual(0)
  })

  // CGW currently returns `enforcement: null` for every catalogue entry.
  it('availablePolicyBuilder: enforcement can be null', () => {
    const a = availablePolicyBuilder().with({ enforcement: null }).build()
    expect(a.enforcement).toBeNull()
  })

  it('pendingPolicyBuilder: request metadata wrapping the decoded change', () => {
    const p = pendingPolicyBuilder().build()
    expect(p.readyAt).toBe(p.requestedAt + 86_400)
    expect(p.isReady).toBe(false)
    expect(p.policy?.type).toBe(PolicyType.TokenWithdraw)
    // CGW returns policy: null for roots it cannot decode.
    expect(pendingPolicyBuilder().with({ policy: null }).build().policy).toBeNull()
  })

  it('pendingPolicyBuilder: carries the guard and the bindings needed to apply', () => {
    const p = pendingPolicyBuilder().build()
    expect(isAddress(p.safePolicyGuard!)).toBe(true)
    expect(p.policies).toHaveLength(1)
    expect(p.policies![0].operation).toBe('CALL')
    // Null bindings model a root CGW has no stored payload for.
    expect(pendingPolicyBuilder().with({ policies: null }).build().policies).toBeNull()
  })
})

describe('ActivePolicy discriminated union narrows on `type`', () => {
  // This function only compiles if the union narrows correctly per discriminant;
  // the runtime assertions confirm the builders match those narrowed shapes.
  const describePolicy = (p: ActivePolicy): string => {
    switch (p.type) {
      case PolicyType.SpendingLimit:
        return `spenders ${p.data.spenders.length}` // data.spenders only exists on this branch
      case PolicyType.Recovery:
        return `recoverers ${p.data.recoverers.length}`
      case PolicyType.TokenWithdraw:
        return `allowlist ${p.data.allowlist.length}` // data.allowlist only exists here
      case PolicyType.Cosigner:
        return `cosigner ${p.data.cosignerAddress}`
      case PolicyType.Proposer:
        return `proposers ${p.data.proposers.length}`
      // The stateless policies share one branch: the wire sends `{}` for all of them.
      case PolicyType.Allow:
      case PolicyType.NativeTransfer:
      case PolicyType.Deny:
      case PolicyType.MultiSend:
        return 'stateless'
    }
  }

  it('narrows each variant to its own data shape', () => {
    expect(describePolicy(spendingLimitPolicyBuilder().build())).toMatch(/^spenders \d+$/)
    expect(describePolicy(recoveryPolicyBuilder().build())).toMatch(/^recoverers \d+$/)
    expect(describePolicy(tokenWithdrawPolicyBuilder().build())).toMatch(/^allowlist \d+$/)
    expect(describePolicy(cosignerPolicyBuilder().build())).toMatch(/^cosigner 0x/)
    expect(describePolicy(allowPolicyBuilder().build())).toBe('stateless')
  })
})
