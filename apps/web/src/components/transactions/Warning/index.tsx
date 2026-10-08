import type { ReactElement } from 'react'
import { UntrustedFallbackHandlerTxText } from '@/components/tx/confirmation-views/SettingsChange/UntrustedFallbackHandlerTxAlert'
import type { TransactionDetails } from '@safe-global/store/gateway/AUTO_GENERATED/transactions'
import { Operation } from '@safe-global/store/gateway/types'
import {
  DelegateCallWarningView,
  ThresholdWarningView,
  UnsignedWarningView,
  UntrustedFallbackHandlerWarningView,
} from '@views/components/transactions/Warning/WarningView'

export const DelegateCallWarning = ({
  txData,
  showWarning,
}: {
  txData: TransactionDetails['txData']
  showWarning: boolean
}): ReactElement => {
  const isDelegateCall = txData?.operation === Operation.DELEGATE
  const trustedDelegateCall = isDelegateCall && !!txData?.trustedDelegateCallTarget

  if (!isDelegateCall || (!trustedDelegateCall && !showWarning)) return <></>

  return <DelegateCallWarningView trustedDelegateCall={trustedDelegateCall} />
}

export const UntrustedFallbackHandlerWarning = ({
  isTxExecuted = false,
}: {
  isTxExecuted?: boolean
}): ReactElement | null => (
  <UntrustedFallbackHandlerWarningView title={<UntrustedFallbackHandlerTxText isTxExecuted={isTxExecuted} />} />
)

export const ThresholdWarning = (): ReactElement => <ThresholdWarningView />

export const UnsignedWarning = (): ReactElement => <UnsignedWarningView />
