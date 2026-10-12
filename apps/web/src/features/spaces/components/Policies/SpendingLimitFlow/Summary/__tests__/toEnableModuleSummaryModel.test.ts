import { MOCK_ADDRESSES, MOCK_SAFES, MOCK_TOKENS, mockSpendingLimitPolicy } from '../../../mocks/policies'
import { groupSafeAccounts } from '../../../SafeAccountSelector/utils'
import { safeAccountOptionBuilder } from '../SpendingLimitSummary.fixtures'
import { toEnableModuleSummaryModel } from '../toEnableModuleSummaryModel'

describe('toEnableModuleSummaryModel', () => {
  const policy = mockSpendingLimitPolicy({ enabled: false })
  const treasury = safeAccountOptionBuilder()
    .with({
      id: `1:${MOCK_SAFES.treasury.address}`,
      chainId: MOCK_SAFES.treasury.chainId,
      address: MOCK_SAFES.treasury.address,
    })
    .build()

  it('shows every stored limit in human units with its reset period', () => {
    const model = toEnableModuleSummaryModel(policy.safe, policy.data.spenders, { accounts: [treasury], names: {} })

    expect(model.spenders).toEqual([
      {
        address: MOCK_ADDRESSES.alice,
        name: undefined,
        limits: [
          {
            token: { ...MOCK_TOKENS.usdc },
            amount: '1500',
            resetTimeMin: String(60 * 24 * 30),
          },
          {
            token: { ...MOCK_TOKENS.usdt },
            amount: '1000',
            resetTimeMin: String(60 * 24 * 30),
          },
        ],
      },
    ])
  })

  it('finds the Safe whatever the casing of the indexed address, also inside a multi-chain group', () => {
    const other = safeAccountOptionBuilder().with({ address: MOCK_SAFES.treasury.address, chainId: '137' }).build()
    const lowercased = { ...policy.safe, address: policy.safe.address.toLowerCase() }

    const model = toEnableModuleSummaryModel(lowercased, policy.data.spenders, {
      accounts: groupSafeAccounts([treasury, other]),
      names: {},
    })

    expect(model.safe).toBe(treasury)
  })

  it('falls back to a minimal Safe while the account list does not have it', () => {
    const model = toEnableModuleSummaryModel(policy.safe, policy.data.spenders, { accounts: [], names: {} })

    expect(model.safe).toMatchObject({ chainId: '1', address: MOCK_SAFES.treasury.address })
  })

  it('names spenders from the address book regardless of casing', () => {
    const model = toEnableModuleSummaryModel(policy.safe, policy.data.spenders, {
      accounts: [treasury],
      names: { [MOCK_ADDRESSES.alice.toLowerCase()]: 'Alice' },
    })

    expect(model.spenders[0].name).toBe('Alice')
  })
})
