export {}
// import { BigNumber } from 'ethers'
// import { faker } from '@faker-js/faker'
// import { DetailedExecutionInfoType } from '@safe-global/safe-gateway-typescript-sdk'
// import type { MultisigExecutionInfo, Transaction } from '@safe-global/safe-gateway-typescript-sdk'

// import { safeInfoBuilder } from '@/tests/builders/safe'
// import { _getTransactionsToDisplay } from './PendingTxsList'
// import type { RecoveryQueueItem } from '@/features/recovery/services/recovery-state'

// describe('_getTransactionsToDisplay', () => {
//   it('should return the recovery queue if it has more than or equal to MAX_TXS items', () => {
//     const walletAddress = faker.finance.ethereumAddress()
//     const safe = safeInfoBuilder().build()
//     const recoveryQueue = [
//       { timestamp: BigNumber.from(1) },
//       { timestamp: BigNumber.from(2) },
//       { timestamp: BigNumber.from(3) },
//       { timestamp: BigNumber.from(4) },
//       { timestamp: BigNumber.from(5) },
//     ] as Array<RecoveryQueueItem>
//     const queue = [] as Array<Transaction>

//     const result = _getTransactionsToDisplay({ recoveryQueue, queue, walletAddress, safe })
//     expect(result).toStrictEqual([recoveryQueue.slice(0, 4), []])
//   })

//   it('should return the recovery queue followed by the actionable transactions from the queue', () => {
//     const walletAddress = faker.finance.ethereumAddress()
//     const safe = safeInfoBuilder().build()
//     const recoveryQueue = [
//       { timestamp: BigNumber.from(1) },
//       { timestamp: BigNumber.from(2) },
//       { timestamp: BigNumber.from(3) },
//     ] as Array<RecoveryQueueItem>
//     const actionableQueue = [
//       {
//         transaction: { id: '1' },
//         executionInfo: {
//           type: DetailedExecutionInfoType.MULTISIG,
//           missingSigners: [walletAddress],
//         } as unknown as MultisigExecutionInfo,
//       } as unknown as Transaction,
//       {
//         transaction: { id: '2' },
//         executionInfo: {
//           type: DetailedExecutionInfoType.MULTISIG,
//           missingSigners: [walletAddress],
//         } as unknown as MultisigExecutionInfo,
//       } as unknown as Transaction,
//     ]

//     const expected = [recoveryQueue, [actionableQueue[0]]]
//     const result = _getTransactionsToDisplay({ recoveryQueue, queue: actionableQueue, walletAddress, safe })
//     expect(result).toEqual(expected)
//   })

//   it('should return the recovery queue followed by the transactions from the queue if there are no actionable transactions', () => {
//     const walletAddress = faker.finance.ethereumAddress()
//     const safe = safeInfoBuilder().build()
//     const recoveryQueue = [
//       { timestamp: BigNumber.from(1) },
//       { timestamp: BigNumber.from(2) },
//       { timestamp: BigNumber.from(3) },
//     ] as Array<RecoveryQueueItem>
//     const queue = [{ transaction: { id: '1' } }, { transaction: { id: '2' } }] as Array<Transaction>

//     const expected = [recoveryQueue, [queue[0]]]
//     const result = _getTransactionsToDisplay({ recoveryQueue, queue, walletAddress, safe })
//     expect(result).toEqual(expected)
//   })
// })
