import { faker } from '@faker-js/faker'
import { erc20TokenBuilder } from '@/tests/builders/balances'
import { spendingLimitStateBuilder } from '@/tests/builders/spendingLimits'
import { withTokenLogos } from '../withTokenLogos'

const limitWithoutLogo = (address: string) => {
  const spendingLimit = spendingLimitStateBuilder().build()
  return { ...spendingLimit, token: { ...spendingLimit.token, address, logoUri: undefined } }
}

describe('withTokenLogos', () => {
  it('takes the logo of the same token from the balances, whatever the address case', () => {
    const token = erc20TokenBuilder().build()

    const [spendingLimit] = withTokenLogos([limitWithoutLogo(token.address.toLowerCase())], [token])

    expect(spendingLimit.token.logoUri).toBe(token.logoUri)
  })

  it('keeps a logo that the limit already has', () => {
    const spendingLimit = spendingLimitStateBuilder().build()
    const token = erc20TokenBuilder().with({ address: spendingLimit.token.address }).build()

    expect(withTokenLogos([spendingLimit], [token])).toEqual([spendingLimit])
  })

  it('leaves the logo empty when the Safe holds none of the token', () => {
    const spendingLimit = limitWithoutLogo(faker.finance.ethereumAddress())

    expect(withTokenLogos([spendingLimit], [erc20TokenBuilder().build()])).toEqual([spendingLimit])
  })
})
