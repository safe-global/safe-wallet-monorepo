import type { MultisigExecutionInfo, ModuleTransaction } from '@safe-global/store/gateway/AUTO_GENERATED/transactions'
import { DetailedExecutionInfoType } from '@safe-global/store/gateway/types'
import { faker } from '@faker-js/faker'

import { safeInfoBuilder } from '@/tests/builders/safe'
import { _getTransactionsToDisplay } from './PendingTxsList'
import type { RecoveryQueueItem } from '@/features/recovery/services/recovery-state'

describe('_getTransactionsToDisplay', () => {
  it('should return the recovery queue if it has more than or equal to MAX_TXS items', () => {
    const walletAddress = faker.finance.ethereumAddress()
    const safe = safeInfoBuilder().build()
    const recoveryQueue = [
      { timestamp: BigInt(1) },
      { timestamp: BigInt(2) },
      { timestamp: BigInt(3) },
      { timestamp: BigInt(4) },
      { timestamp: BigInt(5) },
    ] as Array<RecoveryQueueItem>
    const queue = [] as Array<ModuleTransaction>

    const result = _getTransactionsToDisplay({ recoveryQueue, queue, walletAddress, safe })
    expect(result).toStrictEqual([recoveryQueue.slice(0, 4), []])
  })

  it('should return the recovery queue followed by the actionable transactions from the queue', () => {
    const walletAddress = faker.finance.ethereumAddress()
    const safe = safeInfoBuilder().build()
    const recoveryQueue = [
      { timestamp: BigInt(1) },
      { timestamp: BigInt(2) },
      { timestamp: BigInt(3) },
    ] as Array<RecoveryQueueItem>
    const actionableQueue = [
      {
        transaction: { id: '1' },
        executionInfo: {
          type: DetailedExecutionInfoType.MULTISIG,
          missingSigners: [walletAddress],
        } as unknown as MultisigExecutionInfo,
      } as unknown as ModuleTransaction,
      {
        transaction: { id: '2' },
        executionInfo: {
          type: DetailedExecutionInfoType.MULTISIG,
          missingSigners: [walletAddress],
        } as unknown as MultisigExecutionInfo,
      } as unknown as ModuleTransaction,
    ]

    const expected = [recoveryQueue, [actionableQueue[0]]]
    const result = _getTransactionsToDisplay({ recoveryQueue, queue: actionableQueue, walletAddress, safe })
    expect(result).toEqual(expected)
  })

  it('should return the recovery queue followed by the transactions from the queue if there are no actionable transactions', () => {
    const walletAddress = faker.finance.ethereumAddress()
    const safe = safeInfoBuilder().build()
    const recoveryQueue = [
      { timestamp: BigInt(1) },
      { timestamp: BigInt(2) },
      { timestamp: BigInt(3) },
    ] as Array<RecoveryQueueItem>
    const queue = [{ transaction: { id: '1' } }, { transaction: { id: '2' } }] as Array<ModuleTransaction>

    const expected = [recoveryQueue, [queue[0]]]
    const result = _getTransactionsToDisplay({ recoveryQueue, queue, walletAddress, safe })
    expect(result).toEqual(expected)
  })
})
