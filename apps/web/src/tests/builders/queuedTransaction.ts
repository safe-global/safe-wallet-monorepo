import { faker } from '@faker-js/faker'
import type {
  MultisigExecutionInfo,
  Transaction,
  TransactionQueuedItem,
} from '@safe-global/store/gateway/AUTO_GENERATED/transactions'
import { Builder, type IBuilder } from '@/tests/Builder'

export function multisigExecutionInfoBuilder(): IBuilder<MultisigExecutionInfo> {
  return Builder.new<MultisigExecutionInfo>().with({
    type: 'MULTISIG',
    nonce: faker.number.int({ max: 1000 }),
    confirmationsRequired: 2,
    confirmationsSubmitted: 1,
    missingSigners: [],
  })
}

/** A queued multisig transaction summary, as CGW lists it in the queue */
export function multisigTransactionBuilder(): IBuilder<Transaction> {
  return Builder.new<Transaction>().with({
    id: `multisig_${faker.finance.ethereumAddress()}_${faker.string.hexadecimal({ length: 64, casing: 'lower' })}`,
    timestamp: faker.date.past().getTime(),
    txStatus: 'AWAITING_CONFIRMATIONS',
    txInfo: {
      type: 'Custom',
      to: { value: faker.finance.ethereumAddress() },
      dataSize: '0',
      value: '0',
      isCancellation: false,
      methodName: null,
    },
    executionInfo: multisigExecutionInfoBuilder().build(),
  })
}

export function queuedTransactionItem(
  transaction: Transaction,
  conflictType: TransactionQueuedItem['conflictType'] = 'None',
): TransactionQueuedItem {
  return { type: 'TRANSACTION', transaction, conflictType }
}
