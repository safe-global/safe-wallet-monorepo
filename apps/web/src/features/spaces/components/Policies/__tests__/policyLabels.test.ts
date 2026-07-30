import { PolicyType } from '@safe-global/store/gateway/policies/types'
import {
  allowPolicyBuilder,
  cosignerPolicyBuilder,
  recoveryPolicyBuilder,
  spendingLimitPolicyBuilder,
  tokenInfoBuilder,
  tokenWithdrawPolicyBuilder,
} from '@/tests/builders/policies'
import { entryLabelOf, entrySummaryOf, labelOf, summarize, tokensOf } from '../policyLabels'

describe('labelOf', () => {
  it('names each known type', () => {
    expect(labelOf(PolicyType.TokenWithdraw)).toBe('Token withdraw allowlist')
    expect(labelOf(PolicyType.Allow)).toBe('Allow by default')
    expect(labelOf(PolicyType.Deny)).toBe('Deny by default')
    expect(labelOf(PolicyType.NativeTransfer)).toBe('Native transfers')
  })

  it('falls back to the wire value for a type it does not know', () => {
    expect(labelOf('SomeNewPolicy' as PolicyType)).toBe('SomeNewPolicy')
  })
})

describe('entryLabelOf', () => {
  // Rows sit inside a section already named after the type, so they name their scope.
  it('names the tokens a withdraw allowlist covers', () => {
    const usdc = tokenInfoBuilder().with({ symbol: 'USDC' }).build()
    const dai = tokenInfoBuilder().with({ symbol: 'DAI' }).build()
    const policy = tokenWithdrawPolicyBuilder()
      .with({
        data: {
          allowlist: [
            { token: usdc, recipients: [{ address: usdc.address }] },
            { token: dai, recipients: [{ address: dai.address }] },
          ],
        },
      })
      .build()

    expect(entryLabelOf(policy)).toBe('USDC · DAI')
  })

  it('names the spender of a spending limit', () => {
    const policy = spendingLimitPolicyBuilder()
      .with({ data: { beneficiary: '0x1111111111111111111111111111111111111111', limits: [] } })
      .build()

    expect(entryLabelOf(policy)).toBe('0x1111...1111')
  })

  it('names the recoverer', () => {
    const policy = recoveryPolicyBuilder()
      .with({
        data: { recoverers: ['0x2222222222222222222222222222222222222222'], cooldownSec: '0', expirySec: '0' },
      })
      .build()

    expect(entryLabelOf(policy)).toBe('0x2222...2222')
  })

  it('says a catch-all applies to any transaction', () => {
    expect(entryLabelOf(allowPolicyBuilder().build())).toBe('Any transaction')
  })
})

describe('entrySummaryOf', () => {
  // The label already names the token, so the summary counts recipients only.
  it('counts allowed recipients without repeating the token', () => {
    const token = tokenInfoBuilder().build()
    const policy = tokenWithdrawPolicyBuilder()
      .with({
        data: {
          allowlist: [{ token, recipients: [{ address: token.address }, { address: token.address }] }],
        },
      })
      .build()

    expect(entrySummaryOf(policy)).toBe('2 allowed recipients')
  })

  it('singularises a lone recipient', () => {
    const token = tokenInfoBuilder().build()
    const policy = tokenWithdrawPolicyBuilder()
      .with({ data: { allowlist: [{ token, recipients: [{ address: token.address }] }] } })
      .build()

    expect(entrySummaryOf(policy)).toBe('1 allowed recipient')
  })

  it('stays empty for a single recoverer, which the label already names', () => {
    const policy = recoveryPolicyBuilder()
      .with({ data: { recoverers: ['0x2222222222222222222222222222222222222222'], cooldownSec: '0', expirySec: '0' } })
      .build()

    expect(entrySummaryOf(policy)).toBe('')
  })

  it('counts cosigner rules', () => {
    expect(entrySummaryOf(cosignerPolicyBuilder().build())).toBe('1 rule')
  })
})

describe('tokensOf', () => {
  it('returns the tokens a withdraw allowlist covers, for the row badges', () => {
    const token = tokenInfoBuilder().with({ symbol: 'USDC' }).build()
    const policy = tokenWithdrawPolicyBuilder()
      .with({ data: { allowlist: [{ token, recipients: [] }] } })
      .build()

    expect(tokensOf(policy)).toEqual([token])
  })

  it('returns nothing for a type with no token scope', () => {
    expect(tokensOf(allowPolicyBuilder().build())).toEqual([])
  })
})

describe('summarize (type-level)', () => {
  it('still describes a policy in full, for views without a section header', () => {
    const policy = tokenWithdrawPolicyBuilder().build()

    expect(summarize(policy)).toMatch(/token\(s\)/)
  })
})
