import { faker } from '@faker-js/faker'
import { getTotalBridgeFee } from '../getTotalBridgeFee'

describe('getTotalBridgeFee', () => {
  it('returns the sum of the integrator and LiFi fees', () => {
    const integratorFee = faker.number.bigInt()
    const lifiFee = faker.number.bigInt()

    const result = getTotalBridgeFee({
      tokenAddress: faker.finance.ethereumAddress(),
      integratorFee: integratorFee.toString(),
      lifiFee: lifiFee.toString(),
    })

    expect(result).toBe(integratorFee + lifiFee)
  })

  it('returns null if the fees are unknown', () => {
    expect(getTotalBridgeFee(null)).toBeNull()
  })
})
