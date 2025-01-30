import React, { createContext, useContext } from 'react'
import type { TransactionSummary } from '@safe-global/safe-gateway-typescript-sdk'
import TxLayout from '@/components/tx-flow/common/TxLayout'
import ConfirmProposedTx from './ConfirmProposedTx'
import { useTransactionType } from '@/hooks/useTransactionType'
import TxInfo from '@/components/transactions/TxInfo'

interface ConfirmTxContextProps {
  txSummary: TransactionSummary
  shouldSchedule: boolean
}

const ConfirmTxContext = createContext<ConfirmTxContextProps | undefined>(undefined)

export const useConfirmTx = (): ConfirmTxContextProps => {
  const context = useContext(ConfirmTxContext)
  if (!context) {
    throw new Error('useConfirmTx must be used within a ConfirmTxProvider')
  }
  return context
}

export const ConfirmTxProvider: React.FC<React.PropsWithChildren<ConfirmTxContextProps>> = ({ children, ...props }) => {
  return <ConfirmTxContext.Provider value={props}>{children}</ConfirmTxContext.Provider>
}

const ConfirmTxFlow = ({ txSummary, shouldSchedule }: { txSummary: TransactionSummary; shouldSchedule?: boolean }) => {
  const { text } = useTransactionType(txSummary)

  return (
    <ConfirmTxProvider txSummary={txSummary} shouldSchedule={!!shouldSchedule}>
      {' '}
      {/* Note @chase: if shouldSchedule is undefined it doesn't really matter what it's set to. we're signing */}
      <TxLayout
        title="Confirm transaction"
        subtitle={
          <>
            {text}&nbsp;
            <TxInfo info={txSummary.txInfo} withLogo={false} omitSign />
          </>
        }
        step={0}
        txSummary={txSummary}
      >
        <ConfirmProposedTx txSummary={txSummary} />
      </TxLayout>
    </ConfirmTxProvider>
  )
}

export default ConfirmTxFlow
