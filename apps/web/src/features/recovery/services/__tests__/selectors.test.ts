import { faker } from '@faker-js/faker'

import {
  selectDelayModifierByRecoverer,
  selectRecoveryQueues,
  selectDelayModifierByTxHash,
  selectDelayModifierByAddress,
} from '../selectors'
import type { RecoveryStateItem } from '../recovery-state'

describe('selectors', () => {
  describe('selectDelayModifierByRecoverer', () => {
    it('should return the Delay Modifier for the given recoverer', () => {
      const delayModifier1 = {
        recoverers: [faker.finance.ethereumAddress(), faker.finance.ethereumAddress()],
        queue: [{ timestamp: BigInt(1) }],
      } as unknown as RecoveryStateItem

      const delayModifier2 = {
        recoverers: [faker.finance.ethereumAddress()],
      } as unknown as RecoveryStateItem

      const delayModifier3 = {
        recoverers: [faker.finance.ethereumAddress()],
      } as unknown as RecoveryStateItem

      const data = [delayModifier1, delayModifier2, delayModifier3]

      expect(selectDelayModifierByRecoverer(data, delayModifier1.recoverers[0])).toStrictEqual(delayModifier1)
    })
  })

  describe('selectRecoveryQueues', () => {
    it('should return all recovery queues sorted by timestamp', () => {
      const delayModifier1 = {
        queue: [{ timestamp: BigInt(1) }, { timestamp: BigInt(3) }],
      } as unknown as RecoveryStateItem

      const delayModifier2 = {
        queue: [{ timestamp: BigInt(2) }, { timestamp: BigInt(5) }],
      } as unknown as RecoveryStateItem

      const delayModifier3 = {
        queue: [{ timestamp: BigInt(4) }, { timestamp: BigInt(6) }],
      } as unknown as RecoveryStateItem

      const data = [delayModifier1, delayModifier2, delayModifier3]

      expect(selectRecoveryQueues(data)).toStrictEqual([
        { timestamp: BigInt(1) },
        { timestamp: BigInt(2) },
        { timestamp: BigInt(3) },
        { timestamp: BigInt(4) },
        { timestamp: BigInt(5) },
        { timestamp: BigInt(6) },
      ])
    })
  })

  describe('selectDelayModifierByTxHash', () => {
    it('should return the Delay Modifier for the given txHash', () => {
      const txHash = faker.string.hexadecimal()

      const delayModifier1 = {
        queue: [{ transactionHash: txHash }],
      } as unknown as RecoveryStateItem

      const delayModifier2 = {
        queue: [{ transactionHash: faker.string.hexadecimal() }],
      } as unknown as RecoveryStateItem

      const delayModifier3 = {
        queue: [{ transactionHash: faker.string.hexadecimal() }],
      } as unknown as RecoveryStateItem

      const data = [delayModifier1, delayModifier2, delayModifier3]

      expect(selectDelayModifierByTxHash(data, txHash)).toStrictEqual(delayModifier1)
    })
  })

  describe('selectDelayModifierByAddress', () => {
    it('should return the Delay Modifier for the given address', () => {
      const delayModifier1 = {
        address: faker.finance.ethereumAddress(),
      } as unknown as RecoveryStateItem

      const delayModifier2 = {
        address: faker.finance.ethereumAddress(),
      } as unknown as RecoveryStateItem

      const delayModifier3 = {
        address: faker.finance.ethereumAddress(),
      } as unknown as RecoveryStateItem

      const data = [delayModifier1, delayModifier2, delayModifier3]

      expect(selectDelayModifierByAddress(data, delayModifier3.address)).toStrictEqual(delayModifier3)
    })
  })

  describe('selectDelayModifierByAddress', () => {
    it('should return the Delay Modifier for the given txHash', () => {
      const delayModifier1 = {
        address: faker.finance.ethereumAddress(),
      } as unknown as RecoveryStateItem

      const delayModifier2 = {
        address: faker.finance.ethereumAddress(),
      } as unknown as RecoveryStateItem

      const delayModifier3 = {
        address: faker.finance.ethereumAddress(),
      } as unknown as RecoveryStateItem

      const data = [delayModifier1, delayModifier2, delayModifier3]

      expect(selectDelayModifierByAddress(data, delayModifier2.address)).toStrictEqual(delayModifier2)
    })
  })
})
