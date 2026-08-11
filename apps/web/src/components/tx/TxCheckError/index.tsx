import type { ReactElement } from 'react'
import { useCurrentChain } from '@/hooks/useChains'
import { isRateLimitError, isRevertError, RATE_LIMIT_USER_MESSAGE } from '@/utils/transaction-errors'
import ErrorMessage from '@/components/tx/ErrorMessage'

export const TX_WILL_FAIL_MESSAGE =
  'This transaction will most likely fail. To save gas costs, reject this transaction.'

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
