import TransactionsProvider from './transactionsContext'
import TransactionLibraryProvider from './transactionLibraryContext'
import React, { PropsWithChildren } from 'react'
import NetworkProvider from './networkContext'

const StoreProvider: React.FC<PropsWithChildren> = ({ children }) => {
  return (
    <NetworkProvider>
      <TransactionsProvider>
        <TransactionLibraryProvider>{children}</TransactionLibraryProvider>
      </TransactionsProvider>
    </NetworkProvider>
  )
}

export { useTransactions } from './transactionsContext'
export { useTransactionLibrary } from './transactionLibraryContext'
export { useNetwork } from './networkContext'

export default StoreProvider
