import type { TransactionData } from '@safe-global/store/gateway/AUTO_GENERATED/transactions'
import {
  UntrustedFallbackHandlerTxAlert,
  useSetsUntrustedFallbackHandler,
} from '../confirmation-views/SettingsChange/UntrustedFallbackHandlerTxAlert'

export const TransactionWarnings = ({ txData }: { txData?: TransactionData }) => {
  const isUntrustedFallbackHandler = useSetsUntrustedFallbackHandler(txData)
  return <>{isUntrustedFallbackHandler && <UntrustedFallbackHandlerTxAlert />}</>
}
