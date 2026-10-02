import { ZERO_ADDRESS } from '@safe-global/utils/utils/constants'
import { shortenAddress } from '@safe-global/utils/utils/formatters'
import { buildSafeAccountId, groupSafeAccounts } from '../../../SafeAccountSelector/utils'
import { tokenOptionBuilder } from '../../utils/tokenOptions.fixtures'
import type { SpendingLimitPolicyFormValues } from '../../types'
import { safeAccountOptionBuilder } from '../SpendingLimitSummary.fixtures'
import { toPolicySummaryModel } from '../toPolicySummaryModel'

const SPENDER = '0x8675B754342754A30A2AeF474D114d8460bca19b'

describe('toPolicySummaryModel', () => {
  const safe = safeAccountOptionBuilder().build()
  const eth = tokenOptionBuilder().with({ address: ZERO_ADDRESS, symbol: 'ETH', decimals: 18 }).build()
  const values: SpendingLimitPolicyFormValues = {
    safe: safe.id,
    spenders: [{ address: SPENDER, limits: [{ tokenAddress: ZERO_ADDRESS, amount: '0.5', resetTime: '10080' }] }],
  }

  it('resolves the Safe from the eligible list, tokens from the options and names from the address book', () => {
    const model = toPolicySummaryModel(values, { accounts: [safe], tokens: [eth], names: { [SPENDER]: 'Alice' } })

    expect(model.safe).toBe(safe)
    expect(model.spenders).toEqual([
      {
        address: SPENDER,
        name: 'Alice',
        limits: [
          {
            token: { address: ZERO_ADDRESS, symbol: 'ETH', decimals: 18, logoUri: eth.logoUri },
            amount: '0.5',
            resetTimeMin: '10080',
          },
        ],
      },
    ])
  })

  it('finds the Safe inside a multi-chain group', () => {
    const onPolygon = safeAccountOptionBuilder()
      .with({ address: safe.address, chainId: '137', id: buildSafeAccountId('137', safe.address) })
      .build()

    const model = toPolicySummaryModel(values, {
      accounts: groupSafeAccounts([safe, onPolygon]),
      tokens: [],
      names: {},
    })

    expect(model.safe.id).toBe(safe.id)
  })

  it('falls back to a minimal Safe from the scope key when the eligible list has not resolved it', () => {
    const model = toPolicySummaryModel(values, { accounts: [], tokens: [], names: {} })

    expect(model.safe).toEqual({ id: safe.id, chainId: safe.chainId, address: safe.address, eligibility: 'signer' })
  })

  it('matches address-book names regardless of address casing and leaves unknown spenders unnamed', () => {
    const named = toPolicySummaryModel(values, {
      accounts: [safe],
      tokens: [eth],
      names: { [SPENDER.toLowerCase()]: 'Alice' },
    })
    const unnamed = toPolicySummaryModel(values, { accounts: [safe], tokens: [eth], names: {} })

    expect(named.spenders[0].name).toBe('Alice')
    expect(unnamed.spenders[0].name).toBeUndefined()
  })

  it('stands in a shortened-address token when the option list does not know the token', () => {
    const model = toPolicySummaryModel(values, { accounts: [safe], tokens: [], names: {} })

    expect(model.spenders[0].limits[0].token).toEqual({ address: ZERO_ADDRESS, symbol: shortenAddress(ZERO_ADDRESS) })
  })
})
