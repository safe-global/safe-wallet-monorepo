import { useMemo, type ReactElement } from 'react'
import { Alert, SvgIcon } from '@mui/material'
import InfoOutlinedIcon from '@/public/images/notifications/info.svg'
import { useHasUntrustedFallbackHandler } from '@/hooks/useHasUntrustedFallbackHandler'
import { FallbackHandlerWarning } from '@/components/settings/FallbackHandler'
import type { TransactionDetails } from '@safe-global/safe-gateway-typescript-sdk'

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
  <>
    <FallbackHandlerWarning
      message={
        <>
          This transaction {isTxExecuted ? 'has set' : 'sets'} an <b>unofficial</b> fallback handler.
        </>
      }
      txBuilderLinkPrefix={isTxExecuted ? 'It can be altered via the' : ''}
    />
    {!isTxExecuted && (
      <>
        <br />
        <b>Proceed with caution:</b> ensure the fallback handler address is trusted and secure. If unsure, do not
        proceed.
      </>
    )}
  </>
)

export const UntrustedFallbackHandlerTxAlert = ({
  isTxExecuted = false,
}: {
  isTxExecuted?: boolean
}): ReactElement | null => (
  <Alert
    data-testid="untrusted-fallback-handler-alert"
    severity="warning"
    icon={<SvgIcon component={InfoOutlinedIcon} inheritViewBox color="error" />}
    sx={{ mb: 1 }}
  >
    <UntrustedFallbackHandlerTxText isTxExecuted={isTxExecuted} />
  </Alert>
)
