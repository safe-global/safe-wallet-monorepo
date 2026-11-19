import { faker } from '@faker-js/faker'
import { getAddress, parseUnits } from 'ethers'
import type { TokenApproval } from '@safe-global/utils/features/token-approvals/allowances'
import { chainBuilder } from '@/tests/builders/chains'
import { toApprovalItem } from '../toApprovalItem'

const randomAddress = () => getAddress(faker.finance.ethereumAddress())

const buildApproval = (overrides: Partial<TokenApproval> = {}): TokenApproval => ({
  key: faker.string.uuid(),
  token: { value: randomAddress(), symbol: 'USDC', decimals: 6 },
  spender: { value: randomAddress() },
  allowance: parseUnits('204', 6),
  isUnlimited: false,
  lastApproval: { txHash: null, timestamp: Date.UTC(2026, 0, 2) },
  ...overrides,
})

describe('toApprovalItem', () => {
  it('shows a limited allowance in token units with its symbol', () => {
    expect(toApprovalItem(buildApproval(), undefined).amountLabel).toBe('204 USDC')
  })

  it('shows an unlimited allowance as Unlimited', () => {
    expect(toApprovalItem(buildApproval({ isUnlimited: true }), undefined).amountLabel).toBe('Unlimited')
  })

  it('names a known spender and shortens an unknown one', () => {
    const unknown = buildApproval()
    const known = buildApproval({ spender: { value: randomAddress(), name: 'Uniswap Permit2' } })

    expect(toApprovalItem(known, undefined).spenderLabel).toBe('Uniswap Permit2')
    expect(toApprovalItem(unknown, undefined).spenderLabel).toBe(
      `${unknown.spender.value.slice(0, 6)}...${unknown.spender.value.slice(-4)}`,
    )
  })

  it('links the spender to the chain’s block explorer', () => {
    const chain = chainBuilder()
      .with({ blockExplorerUriTemplate: { address: 'https://explorer.test/address/{{address}}', txHash: '', api: '' } })
      .build()
    const approval = buildApproval()

    expect(toApprovalItem(approval, chain).spenderHref).toBe(`https://explorer.test/address/${approval.spender.value}`)
  })
})
