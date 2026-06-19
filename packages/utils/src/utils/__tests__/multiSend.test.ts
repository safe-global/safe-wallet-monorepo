import { faker } from '@faker-js/faker'
import { resolveMultiSendToAddress } from '../multiSend'
import { ZERO_ADDRESS } from '../constants'

describe('resolveMultiSendToAddress', () => {
  it('resolves the zero address to the executing Safe (MultiSend defaults `to` to address(this))', () => {
    const safeAddress = faker.finance.ethereumAddress()
    expect(resolveMultiSendToAddress(ZERO_ADDRESS, safeAddress)).toBe(safeAddress)
  })

  it('leaves a non-zero target unchanged', () => {
    const to = faker.finance.ethereumAddress()
    const safeAddress = faker.finance.ethereumAddress()
    expect(resolveMultiSendToAddress(to, safeAddress)).toBe(to)
  })

  it('leaves the zero address unchanged when the Safe is unknown', () => {
    expect(resolveMultiSendToAddress(ZERO_ADDRESS, undefined)).toBe(ZERO_ADDRESS)
    expect(resolveMultiSendToAddress(ZERO_ADDRESS, '')).toBe(ZERO_ADDRESS)
  })
})
