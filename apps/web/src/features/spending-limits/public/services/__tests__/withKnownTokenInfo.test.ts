import { faker } from '@faker-js/faker'
import { erc20TokenBuilder } from '@/tests/builders/balances'
import { spendingLimitStateBuilder } from '@/tests/builders/spendingLimits'
import { withKnownTokenInfo } from '../withKnownTokenInfo'

const limitReadFromChain = (address: string) => {
  const spendingLimit = spendingLimitStateBuilder().build()
  return { ...spendingLimit, token: { address, symbol: '', decimals: 18 } }
}

describe('withKnownTokenInfo', () => {
  it('takes the symbol, decimals and logo of the same known token, whatever the address case', () => {
    const token = erc20TokenBuilder().with({ decimals: 6 }).build()

    const [spendingLimit] = withKnownTokenInfo([limitReadFromChain(token.address.toLowerCase())], [token])

    expect(spendingLimit.token).toEqual({
      address: token.address.toLowerCase(),
      symbol: token.symbol,
      decimals: 6,
      logoUri: token.logoUri,
    })
  })

  it('keeps the logo of the limit when the known token has none', () => {
    const spendingLimit = spendingLimitStateBuilder().build()
    const token = erc20TokenBuilder().with({ address: spendingLimit.token.address, logoUri: '' }).build()

    const [result] = withKnownTokenInfo([spendingLimit], [token])

    expect(result.token.logoUri).toBe(spendingLimit.token.logoUri)
  })

  it('leaves a limit on a token the Safe does not know as read from the chain', () => {
    const spendingLimit = limitReadFromChain(faker.finance.ethereumAddress())

    expect(withKnownTokenInfo([spendingLimit], [erc20TokenBuilder().build()])).toEqual([spendingLimit])
  })
})
