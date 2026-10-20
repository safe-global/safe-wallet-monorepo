import { useMemo } from 'react'
import type { SettingsChangeTransaction, Transaction } from '@safe-global/store/gateway/AUTO_GENERATED/transactions'
import { getTransactionType } from '@/hooks/useTransactionType'
import { useQueuedTxByNonce } from '@/hooks/useTxQueue'
import useAddressBook from '@/hooks/useAddressBook'
import type { AddressBook } from '@/store/addressBookSlice'
import { isSettingsChangeTxInfo } from '@/utils/transaction-guards'
import { getLatestTransactions } from '@/utils/tx-list'

const SETTINGS_LABELS: Record<SettingsChangeTransaction['settingsInfo']['type'], string> = {
  ADD_OWNER: 'Add signer',
  REMOVE_OWNER: 'Remove signer',
  SWAP_OWNER: 'Replace signer',
  CHANGE_THRESHOLD: 'Change threshold',
  ENABLE_MODULE: 'Enable module',
  DISABLE_MODULE: 'Disable module',
  SET_GUARD: 'Set guard',
  DELETE_GUARD: 'Remove guard',
  SET_MODULE_GUARD: 'Set module guard',
  DELETE_MODULE_GUARD: 'Remove module guard',
  SET_FALLBACK_HANDLER: 'Set fallback handler',
  CHANGE_MASTER_COPY: 'Update Safe version',
}

export const getQueuedTxLabel = (transaction: Transaction, addressBook: AddressBook): string => {
  const note = transaction.note?.trim()
  if (note) return note
  if (transaction.txInfo.humanDescription) return transaction.txInfo.humanDescription

  const settingsType = isSettingsChangeTxInfo(transaction.txInfo) ? transaction.txInfo.settingsInfo?.type : undefined
  if (settingsType && SETTINGS_LABELS[settingsType]) return SETTINGS_LABELS[settingsType]

  return `${getTransactionType(transaction, addressBook).text} transaction`
}

const useQueuedTxLabel = (nonce?: number): { label?: string; count: number } => {
  const addressBook = useAddressBook()
  const transactions = useQueuedTxByNonce(nonce)

  return useMemo(() => {
    const [latest] = getLatestTransactions(transactions)
    return {
      label: latest ? getQueuedTxLabel(latest.transaction, addressBook) : undefined,
      count: transactions.length,
    }
  }, [addressBook, transactions])
}

export default useQueuedTxLabel
