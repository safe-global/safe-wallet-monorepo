import {
  UntrustedFallbackHandlerTxAlert,
  useSetsUntrustedFallbackHandler,
} from '../confirmation-views/SettingsChange/UntrustedFallbackHandlerTxAlert'
import { type TransactionData } from '@safe-global/safe-gateway-typescript-sdk'

export const TransactionWarnings = ({ txData }: { txData?: TransactionData }) => {
  const isUntrustedFallbackHandler = useSetsUntrustedFallbackHandler(txData)
  return <>{isUntrustedFallbackHandler && <UntrustedFallbackHandlerTxAlert />}</>
}
