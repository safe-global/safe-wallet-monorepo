import { PolicyType } from '@safe-global/store/gateway/policies/types'
import {
  allowPolicyBuilder,
  cosignerPolicyBuilder,
  proposerPolicyBuilder,
  recoveryPolicyBuilder,
  spendingLimitPolicyBuilder,
  tokenInfoBuilder,
  tokenWithdrawPolicyBuilder,
} from '@/tests/builders/policies'
import { entryLabelOf, entrySummaryOf, labelOf, summarize, tokensOf } from '../policyLabels'

const USDC = '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48'
const DAI = '0x6B175474E89094C44Da98b954EedeAC495271d0F'
const recipient = (account: string) => ({ account, permission: 'ALWAYS' })

const guardEnforcement = {
  via: 'guard' as const,
  guards: { transactionGuard: { policyContract: DAI, safePolicyGuard: USDC } },
}
/** The guard's single fallback slot: the zero target and selector. */
const CATCH_ALL_ACCESS = { target: `0x${'0'.repeat(40)}`, selector: '0x00000000', operation: 'CALL' as const }

describe('labelOf', () => {
  it('names each known type', () => {
    expect(labelOf(PolicyType.TokenWithdraw)).toBe('Token withdraw allowlist')
    expect(labelOf(PolicyType.Allow)).toBe('Allow by default')
    expect(labelOf(PolicyType.Deny)).toBe('Deny by default')
    expect(labelOf(PolicyType.NativeTransfer)).toBe('Native transfers')
    expect(labelOf(PolicyType.MultiSend)).toBe('Batched transactions')
  })

  it('falls back to the wire value for a type it does not know', () => {
    expect(labelOf('SomeNewPolicy' as PolicyType)).toBe('SomeNewPolicy')
  })
})

describe('entryLabelOf', () => {
  // Rows sit inside a section already named after the type, so they name their scope.
  // The allowlist sends bare addresses, so there is no symbol to show.
  it('names the tokens a withdraw allowlist covers, by address', () => {
    const policy = tokenWithdrawPolicyBuilder()
      .with({
        data: {
          allowlist: [
            { tokenAddress: USDC, recipients: [recipient(USDC)] },
            { tokenAddress: DAI, recipients: [recipient(DAI)] },
          ],
        },
      })
      .build()

    expect(entryLabelOf(policy)).toBe('0xA0b8...eB48 · 0x6B17...1d0F')
  })

  it('names the spender of a spending limit', () => {
    const policy = spendingLimitPolicyBuilder()
      .with({
        data: {
          module: '0x3333333333333333333333333333333333333333',
          spenders: [{ spender: '0x1111111111111111111111111111111111111111', isActive: true, allowances: [] }],
        },
      })
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

  it('names the cosigner', () => {
    const policy = cosignerPolicyBuilder()
      .with({ data: { cosignerAddress: '0x4444444444444444444444444444444444444444' } })
      .build()

    expect(entryLabelOf(policy)).toBe('0x4444...4444')
  })

  it('says a catch-all applies to any transaction', () => {
    const policy = allowPolicyBuilder()
      .with({ enforcement: { ...guardEnforcement, access: CATCH_ALL_ACCESS } })
      .build()

    expect(entryLabelOf(policy)).toBe('Any transaction')
  })

  // An allow policy is only a catch-all when it sits on the guard's zero access; a scoped
  // one names what it covers.
  it('names the target and selector of a scoped allow policy', () => {
    const policy = allowPolicyBuilder()
      .with({
        enforcement: {
          ...guardEnforcement,
          access: { target: USDC, selector: '0xa9059cbb', operation: 'CALL' },
        },
      })
      .build()

    expect(entryLabelOf(policy)).toBe('0xA0b8...eB48 · 0xa9059cbb')
  })
})

describe('entrySummaryOf', () => {
  // The label already names the token, so the summary counts recipients only.
  it('counts allowed recipients without repeating the token', () => {
    const policy = tokenWithdrawPolicyBuilder()
      .with({ data: { allowlist: [{ tokenAddress: USDC, recipients: [recipient(USDC), recipient(DAI)] }] } })
      .build()

    expect(entrySummaryOf(policy)).toBe('2 allowed recipients')
  })

  it('singularises a lone recipient', () => {
    const policy = tokenWithdrawPolicyBuilder()
      .with({ data: { allowlist: [{ tokenAddress: USDC, recipients: [recipient(USDC)] }] } })
      .build()

    expect(entrySummaryOf(policy)).toBe('1 allowed recipient')
  })

  // Allowances are grouped under each spender on the wire; the count is across all of them.
  it('counts token limits across every spender', () => {
    const allowance = spendingLimitPolicyBuilder().build().data.spenders[0].allowances[0]
    const policy = spendingLimitPolicyBuilder()
      .with({
        data: {
          module: '0x3333333333333333333333333333333333333333',
          spenders: [
            { spender: USDC, isActive: true, allowances: [allowance] },
            { spender: DAI, isActive: true, allowances: [allowance, allowance] },
          ],
        },
      })
      .build()

    expect(entrySummaryOf(policy)).toBe('3 token limits')
  })

  it('stays empty for a single recoverer, which the label already names', () => {
    const policy = recoveryPolicyBuilder()
      .with({ data: { recoverers: ['0x2222222222222222222222222222222222222222'], cooldownSec: '0', expirySec: '0' } })
      .build()

    expect(entrySummaryOf(policy)).toBe('')
  })
})

describe('tokensOf', () => {
  it('returns the allowlist token addresses, for the row badges', () => {
    const policy = tokenWithdrawPolicyBuilder()
      .with({ data: { allowlist: [{ tokenAddress: USDC, recipients: [] }] } })
      .build()

    expect(tokensOf(policy)).toEqual([{ address: USDC, symbol: '' }])
  })

  // Only spending limits carry token metadata on the wire.
  it('uses the token metadata a spending limit carries', () => {
    const token = tokenInfoBuilder().with({ symbol: 'USDC', address: USDC }).build()
    const allowance = {
      ...spendingLimitPolicyBuilder().build().data.spenders[0].allowances[0],
      tokenAddress: USDC,
      tokenMetadata: token,
    }
    const policy = spendingLimitPolicyBuilder()
      .with({ data: { module: DAI, spenders: [{ spender: DAI, isActive: true, allowances: [allowance] }] } })
      .build()

    expect(tokensOf(policy)).toEqual([{ address: USDC, symbol: 'USDC', logoUri: token.logoUri }])
  })

  it('returns nothing for a type with no token scope', () => {
    expect(tokensOf(allowPolicyBuilder().build())).toEqual([])
    expect(tokensOf(proposerPolicyBuilder().build())).toEqual([])
  })
})

describe('summarize (type-level)', () => {
  it('still describes a policy in full, for views without a section header', () => {
    expect(summarize(tokenWithdrawPolicyBuilder().build())).toMatch(/token\(s\)/)
    expect(summarize(proposerPolicyBuilder().build())).toMatch(/proposer\(s\)/)
  })
})
