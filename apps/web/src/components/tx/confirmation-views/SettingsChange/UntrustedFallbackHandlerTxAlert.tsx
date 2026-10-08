import type { TransactionDetails } from '@safe-global/store/gateway/AUTO_GENERATED/transactions'
import { useMemo } from 'react'
import { useHasUntrustedFallbackHandler } from '@/hooks/useHasUntrustedFallbackHandler'
import { FallbackHandlerWarning } from '@/components/settings/FallbackHandler'
import { UntrustedFallbackHandlerTxAlertView } from '@views/components/tx/confirmation-views/SettingsChange/UntrustedFallbackHandlerTxAlertView'

export const useSetsUntrustedFallbackHandler = (txData: TransactionDetails['txData']): boolean => {
  // multiSend method receives one parameter `transactions`
  const multiSendTransactions =
    txData?.dataDecoded?.method === 'multiSend' && txData?.dataDecoded?.parameters?.[0]?.valueDecoded

  const fallbackHandlers = useMemo(() => {
    const transactions = Array.isArray(multiSendTransactions) ? multiSendTransactions : txData ? [txData] : []

    return Array.isArray(transactions)
      ? transactions
          .map(({ dataDecoded }) =>
            dataDecoded?.method === 'setFallbackHandler'
              ? dataDecoded?.parameters?.find(({ name }) => name === 'handler')?.value
              : undefined,
          )
          .filter((handler) => typeof handler === 'string')
      : []
  }, [multiSendTransactions, txData])

  return useHasUntrustedFallbackHandler(fallbackHandlers)
}

export const UntrustedFallbackHandlerTxText = ({ isTxExecuted = false }: { isTxExecuted?: boolean }) => (
  <UntrustedFallbackHandlerTxAlertView
    isTxExecuted={isTxExecuted}
    renderWarning={(props) => <FallbackHandlerWarning {...props} />}
  />
)
