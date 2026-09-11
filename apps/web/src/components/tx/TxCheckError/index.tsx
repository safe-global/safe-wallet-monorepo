import type { ReactElement } from 'react'
import { useCurrentChain } from '@/hooks/useChains'
import {
  HYPERNATIVE_APPROVAL_REQUIRED_MESSAGE,
  isHypernativeGuardRevert,
  isRateLimitError,
  isRevertError,
  RATE_LIMIT_USER_MESSAGE,
} from '@/utils/transaction-errors'
import ErrorMessage from '@/components/tx/ErrorMessage'
import { ExternalLink as ExternalLinkIcon } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { HYPERNATIVE_EVENTS, trackEvent } from '@/services/analytics'
import { useSafeShieldAssessmentUrl } from '@/features/hypernative'

export const TX_WILL_FAIL_MESSAGE =
  'This transaction will most likely fail. To save gas costs, reject this transaction.'

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
    <ErrorMessage level="error">
      {HYPERNATIVE_APPROVAL_REQUIRED_MESSAGE}

      {assessmentUrl && (
        <span className="mt-3 block">
          <Button
            variant="surface"
            size="sm"
            className="gap-2"
            onClick={onHypernativeCtaClick}
            render={<a href={assessmentUrl} target="_blank" rel="noreferrer noopener" />}
          >
            Approve in Hypernative
            <ExternalLinkIcon />
          </Button>
        </span>
      )}
    </ErrorMessage>
  )
}

export const getCouldNotCheckMessage = (network?: string): string =>
  `Could not check this transaction. ${network ?? 'The network'} is not responding. Nothing was signed.`

/**
 * Renders the pre-execution validity/estimation error, keeping two separate
 * states (WA-3005 AC #8): a genuine on-chain revert (the node told us it
 * reverts) warns the transaction will fail so the user can avoid wasting gas;
 * an infrastructure failure (we could not reach the node) only says we could
 * not check — never a prediction about the transaction. A transient rate-limit
 * keeps its own dedicated copy.
 */
const TxCheckError = ({ error, context }: { error: Error; context?: 'estimation' | 'execution' }): ReactElement => {
  const chain = useCurrentChain()

  if (isHypernativeGuardRevert(error)) {
    return <HypernativeApprovalRequired />
  }

  if (isRateLimitError(error)) {
    return (
      <ErrorMessage error={error} level="warning" context={context}>
        {RATE_LIMIT_USER_MESSAGE}
      </ErrorMessage>
    )
  }

  const willRevert = isRevertError(error)

  return (
    <ErrorMessage error={error} level={willRevert ? 'error' : 'warning'} context={context}>
      {willRevert ? TX_WILL_FAIL_MESSAGE : getCouldNotCheckMessage(chain?.chainName)}
    </ErrorMessage>
  )
}

export default TxCheckError
