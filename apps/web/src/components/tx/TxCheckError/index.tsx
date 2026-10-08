import type { ReactElement, ReactNode } from 'react'
import { useCurrentChain } from '@/hooks/useChains'
import {
  getGasLimitTooLowMessage,
  HYPERNATIVE_APPROVAL_REQUIRED_MESSAGE,
  isHypernativeGuardRevert,
  isRateLimitError,
  isRevertError,
  RATE_LIMIT_USER_MESSAGE,
} from '@/utils/transaction-errors'
import { getSpecificContractErrorMessage } from '@safe-global/utils/services/exceptions/contractErrors'
import ErrorMessage from '@/components/tx/ErrorMessage'
import { HYPERNATIVE_EVENTS, trackEvent } from '@/services/analytics'
import { useSafeShieldAssessmentUrl } from '@/features/hypernative'
import {
  getCouldNotCheckMessage,
  TX_WILL_FAIL_MESSAGE,
  TxCheckErrorView,
} from '@views/components/tx/TxCheckError/TxCheckErrorView'

export { getCouldNotCheckMessage, TX_WILL_FAIL_MESSAGE } from '@views/components/tx/TxCheckError/TxCheckErrorView'

const onHypernativeCtaClick = () => {
  trackEvent(HYPERNATIVE_EVENTS.EXECUTION_BLOCKED_APPROVAL_CLICKED)
}

/**
 * The transaction is awaiting approval, not failing — an action to take rather than
 * a prediction. No `error` is passed to `ErrorMessage` on purpose: that drops the
 * guard line, the GS013 reference and the raw-payload Details toggle. The revert
 * still reaches Sentry via `useGasLimit`.
 */
const HypernativeApprovalRequired = (): ReactElement => {
  const assessmentUrl = useSafeShieldAssessmentUrl()

  return (
    <TxCheckErrorView assessmentUrl={assessmentUrl} onHypernativeCtaClick={onHypernativeCtaClick}>
      {HYPERNATIVE_APPROVAL_REQUIRED_MESSAGE}
    </TxCheckErrorView>
  )
}

type Level = 'error' | 'warning'

/**
 * Renders the pre-execution validity/estimation error, keeping two separate
 * states (WA-3005 AC #8): a genuine on-chain revert (the node told us it
 * reverts) warns the transaction will fail so the user can avoid wasting gas;
 * an infrastructure failure (we could not reach the node) only says we could
 * not check — never a prediction about the transaction. A transient rate-limit
 * keeps its own dedicated copy. A revert carrying a GS code we have specific copy for
 * shows that cause instead of the prediction.
 */
const TxCheckError = ({ error, context }: { error: Error; context?: 'estimation' | 'execution' }): ReactElement => {
  const chain = useCurrentChain()

  if (isHypernativeGuardRevert(error)) {
    return <HypernativeApprovalRequired />
  }

  const render = (level: Level, message: ReactNode) => (
    <ErrorMessage error={error} level={level} context={context}>
      {message}
    </ErrorMessage>
  )

  if (isRateLimitError(error)) {
    return render('warning', RATE_LIMIT_USER_MESSAGE)
  }

  // `useIsValidExecution` simulates with the gas limit the user set, so a node that rejects the
  // simulation on intrinsic gas answers here. That is a setting to fix, not a transaction that
  // will fail, so it must never reach the "reject this transaction" advice below.
  const gasLimitTooLow = getGasLimitTooLowMessage(error)
  if (gasLimitTooLow) {
    return render('warning', gasLimitTooLow)
  }

  const willRevert = isRevertError(error)
  // The chain named the cause, so say it instead of predicting a failure. Codes with no copy
  // of their own keep the prediction — it is more useful than the shared fallback here.
  const contractErrorMessage = getSpecificContractErrorMessage(error, { nativeAsset: chain?.nativeCurrency.symbol })

  return render(
    willRevert ? 'error' : 'warning',
    contractErrorMessage ?? (willRevert ? TX_WILL_FAIL_MESSAGE : getCouldNotCheckMessage(chain?.chainName)),
  )
}

export default TxCheckError
