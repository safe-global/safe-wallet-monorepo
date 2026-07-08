import { isValidElement } from 'react'
import { faker } from '@faker-js/faker'
import { TransactionInfoType } from '@safe-global/store/gateway/types'
import type { MultiSendTransactionInfo, Transaction } from '@safe-global/store/gateway/AUTO_GENERATED/transactions'
import { getTransactionType } from '../useTransactionType'

const multiSendTxInfo: MultiSendTransactionInfo = {
  type: TransactionInfoType.CUSTOM,
  to: { value: faker.finance.ethereumAddress() },
  dataSize: '100',
  value: '0',
  isCancellation: false,
  methodName: 'multiSend',
  actionCount: 2,
}

const makeTx = (overrides: Partial<Transaction>): Transaction => ({
  txInfo: multiSendTxInfo,
  id: faker.string.uuid(),
  timestamp: 0,
  txStatus: 'SUCCESS',
  ...overrides,
})

describe('getTransactionType', () => {
  describe('Safe App transaction', () => {
    it('shows the Safe App name and logo when safeAppInfo is present', () => {
      const tx = makeTx({
        safeAppInfo: {
          name: 'Transaction Builder',
          url: 'https://apps.safe.global/tx-builder',
          logoUri: 'https://apps.safe.global/tx-builder/logo.svg',
        },
      })

      const result = getTransactionType(tx, {})

      expect(result.text).toBe('Transaction Builder')
      expect(result.icon).toBe('https://apps.safe.global/tx-builder/logo.svg')
    })

    it('falls back to the custom icon when safeAppInfo has no logo', () => {
      const tx = makeTx({
        safeAppInfo: { name: 'Transaction Builder', url: 'https://apps.safe.global/tx-builder' },
      })

      const result = getTransactionType(tx, {})

      expect(result.text).toBe('Transaction Builder')
      expect(result.icon).toBe('/images/transactions/custom.svg')
    })
  })

  describe('Batch transaction', () => {
    it('shows the Batch label and icon for a multiSend without safeAppInfo', () => {
      const tx = makeTx({ safeAppInfo: null })

      const result = getTransactionType(tx, {})

      expect(result.text).toBe('Batch')
      expect(isValidElement(result.icon)).toBe(true)
    })
  })
})
