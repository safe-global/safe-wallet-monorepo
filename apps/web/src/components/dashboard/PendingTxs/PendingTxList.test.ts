import { faker } from '@faker-js/faker'
import type { MultisigExecutionInfo } from '@safe-global/store/gateway/AUTO_GENERATED/transactions'
import type { RecoveryQueueItem } from '@/features/recovery'
import { safeInfoBuilder } from '@/tests/builders/safe'
import {
  multisigExecutionInfoBuilder,
  multisigTransactionBuilder,
  queuedTransactionItem,
} from '@/tests/builders/queuedTransaction'
import { _getTransactionsToDisplay } from './PendingTxsList'

// The selection only passes recovery items through, so their content does not matter.
const recoveryItems = (count: number): RecoveryQueueItem[] =>
  Array.from({ length: count }, (_, index) => ({ timestamp: BigInt(index) }) as RecoveryQueueItem)

const queuedItem = (nonce: number, execution: Partial<MultisigExecutionInfo> = {}) =>
  queuedTransactionItem(
    multisigTransactionBuilder()
      .with({
        executionInfo: multisigExecutionInfoBuilder()
          .with({ nonce, ...execution })
          .build(),
      })
      .build(),
  )

describe('_getTransactionsToDisplay', () => {
  const walletAddress = faker.finance.ethereumAddress()
  const safe = safeInfoBuilder().with({ nonce: 10 }).build()

  it('shows only the first four recovery items when there are four or more', () => {
    const recoveryQueue = recoveryItems(5)

    const result = _getTransactionsToDisplay({ recoveryQueue, queue: [queuedItem(10)], walletAddress, safe })

    expect(result).toStrictEqual([recoveryQueue.slice(0, 4), []])
  })

  it('shows at most four queued transactions', () => {
    const queue = [10, 11, 12, 13, 14].map((nonce) => queuedItem(nonce))

    const result = _getTransactionsToDisplay({ recoveryQueue: [], queue, safe })

    expect(result).toStrictEqual([[], queue.slice(0, 4)])
  })

  it('fills the rows that the recovery items leave with queued transactions', () => {
    const recoveryQueue = recoveryItems(3)
    const queue = [10, 11].map((nonce) => queuedItem(nonce))

    const result = _getTransactionsToDisplay({ recoveryQueue, queue, safe })

    expect(result).toStrictEqual([recoveryQueue, [queue[0]]])
  })

  it('shows the whole queue when no wallet is connected', () => {
    const queue = [10, 11].map((nonce) => queuedItem(nonce))

    const result = _getTransactionsToDisplay({ recoveryQueue: [], queue, safe })

    expect(result).toStrictEqual([[], queue])
  })

  it('shows only the transactions that the connected wallet can sign', () => {
    const signable = queuedItem(11, { missingSigners: [{ value: walletAddress }] })
    const queue = [queuedItem(10), signable, queuedItem(12)]

    const result = _getTransactionsToDisplay({ recoveryQueue: [], queue, walletAddress, safe })

    expect(result).toStrictEqual([[], [signable]])
  })

  it('shows the next transaction when it has all its signatures, so the wallet can execute it', () => {
    const executable = queuedItem(safe.nonce, { confirmationsSubmitted: 2, confirmationsRequired: 2 })
    // Fully signed too, but a later nonce cannot be executed yet.
    const later = queuedItem(safe.nonce + 1, { confirmationsSubmitted: 2, confirmationsRequired: 2 })

    const result = _getTransactionsToDisplay({ recoveryQueue: [], queue: [executable, later], walletAddress, safe })

    expect(result).toStrictEqual([[], [executable]])
  })

  it('shows the whole queue when the connected wallet has nothing to sign or execute', () => {
    const queue = [10, 11].map((nonce) =>
      queuedItem(nonce, { missingSigners: [{ value: faker.finance.ethereumAddress() }] }),
    )

    const result = _getTransactionsToDisplay({ recoveryQueue: [], queue, walletAddress, safe })

    expect(result).toStrictEqual([[], queue])
  })
})
