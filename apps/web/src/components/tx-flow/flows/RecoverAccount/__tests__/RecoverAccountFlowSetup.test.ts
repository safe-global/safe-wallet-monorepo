import type { AddressInfo } from '@safe-global/store/gateway/AUTO_GENERATED/transactions'
import { faker } from '@faker-js/faker'
import shuffle from 'lodash/shuffle'

import { _isSameSetup } from '../RecoverAccountFlowSetup'

describe('RecoverAccountFlowSetup', () => {
  describe('isSameSetup', () => {
    it('should return true if the owners and threshold are the same', () => {
      const oldOwners: Array<AddressInfo> = [
        { value: faker.finance.ethereumAddress() },
        { value: faker.finance.ethereumAddress() },
        { value: faker.finance.ethereumAddress() },
        { value: faker.finance.ethereumAddress() },
      ]
      const oldThreshold = faker.number.int({ min: 1, max: oldOwners.length })

      const newOwners = shuffle(oldOwners)

      expect(
        _isSameSetup({
          oldOwners,
          oldThreshold,
          newOwners,
          newThreshold: oldThreshold,
        }),
      ).toBe(true)
    })

    it('should return false if the owners are the same but the threshold is different', () => {
      const oldOwners: Array<AddressInfo> = [
        { value: faker.finance.ethereumAddress() },
        { value: faker.finance.ethereumAddress() },
        { value: faker.finance.ethereumAddress() },
        { value: faker.finance.ethereumAddress() },
      ]
      const oldThreshold = 1

      const newOwners = shuffle(oldOwners)
      const newThreshold = 2

      expect(
        _isSameSetup({
          oldOwners,
          oldThreshold,
          newOwners,
          newThreshold,
        }),
      ).toBe(false)
    })

    it('should return false if the threshold is the same but the owners are different', () => {
      const oldOwners: Array<AddressInfo> = [
        { value: faker.finance.ethereumAddress() },
        { value: faker.finance.ethereumAddress() },
        { value: faker.finance.ethereumAddress() },
        { value: faker.finance.ethereumAddress() },
      ]
      const oldThreshold = 2

      const newOwners = [
        { value: faker.finance.ethereumAddress() },
        { value: faker.finance.ethereumAddress() },
        { value: faker.finance.ethereumAddress() },
        { value: faker.finance.ethereumAddress() },
      ]

      expect(
        _isSameSetup({
          oldOwners,
          oldThreshold,
          newOwners,
          newThreshold: oldThreshold,
        }),
      ).toBe(false)
    })
  })
})
