import { createContext, useCallback, useContext, useState, PropsWithChildren } from 'react'
import { trackSafeAppEvent } from '../lib/analytics'
import { ProposedTransaction } from '../typings/models'
import { useNetwork } from './networkContext'

type TransactionContextProps = {
  transactions: ProposedTransaction[]
  resetTransactions: (transactions: ProposedTransaction[]) => void
  addTransaction: (newTransaction: ProposedTransaction) => void
  replaceTransaction: (newTransaction: ProposedTransaction, index: number) => void
  removeTransaction: (index: number) => void
  submitTransactions: () => void
  removeAllTransactions: () => void
  reorderTransactions: (sourceIndex: number, destinationIndex: number) => void
}

export const TransactionContext = createContext<TransactionContextProps | null>(null)

const TransactionsProvider: React.FC<PropsWithChildren> = ({ children }) => {
  const [transactions, setTransactions] = useState<ProposedTransaction[]>([])
  const { sdk } = useNetwork()

  const resetTransactions = useCallback((transactions: ProposedTransaction[]) => {
    setTransactions([...transactions])
  }, [])

  const addTransaction = useCallback((newTransaction: ProposedTransaction) => {
    setTransactions((transactions) => [...transactions, newTransaction])
  }, [])

  const replaceTransaction = useCallback((newTransaction: ProposedTransaction, index: number) => {
    setTransactions((transactions) => {
      transactions[index] = newTransaction
      return [...transactions]
    })
  }, [])

  const removeAllTransactions = useCallback(() => {
    setTransactions([])
  }, [])

  const removeTransaction = useCallback((index: number) => {
    setTransactions((transactions) => {
      const newTxs = transactions.slice()
      newTxs.splice(index, 1)
      return newTxs
    })
  }, [])

  const submitTransactions = useCallback(async () => {
    await sdk.txs.send({
      txs: transactions.map((transaction) => transaction.raw),
    })

    trackSafeAppEvent('Submit transactions confirmed')
  }, [sdk.txs, transactions])

  const reorderTransactions = useCallback((sourceIndex: number, destinationIndex: number) => {
    setTransactions((transactions) => {
      const nextTransactions = transactions.slice()
      const transactionToMove = nextTransactions[sourceIndex]
      nextTransactions.splice(sourceIndex, 1)
      nextTransactions.splice(destinationIndex, 0, transactionToMove)
      return nextTransactions
    })
  }, [])

  return (
    <TransactionContext.Provider
      value={{
        transactions,
        resetTransactions,
        addTransaction,
        replaceTransaction,
        removeTransaction,
        submitTransactions,
        removeAllTransactions,
        reorderTransactions,
      }}
    >
      {children}
    </TransactionContext.Provider>
  )
}

export const useTransactions = () => {
  const contextValue = useContext(TransactionContext)
  if (contextValue === null) {
    throw new Error('Component must be wrapped with <TransactionProvider>')
  }

  return contextValue
}

export default TransactionsProvider
