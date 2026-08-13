import type { ReactElement } from 'react'
import { useCurrentChain } from '@/hooks/useChains'
import { getGs026Message } from '@safe-global/utils/services/exceptions/contractErrors'
import {
  isNonceTooLowError,
  isRateLimitError,
  isRevertError,
  RATE_LIMIT_USER_MESSAGE,
} from '@/utils/transaction-errors'
import { didRevert, type EthersError } from '@/utils/ethers-utils'
import { isGs026PreCheckError } from '@/services/tx/executionPreChecks'
import ErrorMessage from '@/components/tx/ErrorMessage'

export const COULD_NOT_SUBMIT_MESSAGE = 'Could not submit the transaction.'
export const COULD_NOT_SUBMIT_RETRY_MESSAGE = 'Could not submit the transaction. Try again.'

export const getRevertedMessage = (network?: string): string =>
  `Transaction reverted on ${network ?? 'the network'}. Gas was spent.`

/**
 * Renders a submit/execution error.
 *
 * "Gas was spent" is only claimed on positive proof — a mined receipt whose
 * status is 0 (reverted on-chain). A pre-broadcast failure (the common inline
 * case: the wallet/node reverted during estimation) never spends gas, so we
 * never assert it did. A deterministic revert is not offered a retry (it would
 * only waste more gas); a transient failure is. Rate-limits keep their own copy.
 */
const TxSubmitError = ({
  error,
  context = 'execution',
}: {
  error: Error
  context?: 'estimation' | 'execution'
}): ReactElement => {
  const chain = useCurrentChain()

  // A failed GS026 pre-check blocked the broadcast — show its specific,
  // cause-aware message (stale nonce / not a signer / bad signature).
  if (isGs026PreCheckError(error)) {
    return (
      <ErrorMessage error={error} level="error" context={context}>
        {error.message}
      </ErrorMessage>
    )
  }

  // The signer wallet's own Ethereum nonce advanced before broadcast (e.g. it
  // executed another tx meanwhile). Same user story as a stale Safe nonce, so
  // show the same message. Must be checked before the revert classification:
  // viem misleadingly wraps this RPC rejection as a contract revert.
  if (isNonceTooLowError(error)) {
    return (
      <ErrorMessage error={error} level="error" context={context}>
        {getGs026Message('STALE_NONCE')}
      </ErrorMessage>
    )
  }

  if (isRateLimitError(error)) {
    return (
      <ErrorMessage error={error} level="warning" context={context}>
        {RATE_LIMIT_USER_MESSAGE}
      </ErrorMessage>
    )
  }

  // Only a mined receipt with a reverted status proves gas was actually spent.
  if (didRevert((error as EthersError).receipt)) {
    return (
      <ErrorMessage error={error} level="error" context={context}>
        {getRevertedMessage(chain?.chainName)}
      </ErrorMessage>
    )
  }

  // Nothing hit the chain, so no gas was spent. A deterministic revert must not
  // invite a retry; a transient failure can.
  const message = isRevertError(error) ? COULD_NOT_SUBMIT_MESSAGE : COULD_NOT_SUBMIT_RETRY_MESSAGE

  return (
    <ErrorMessage error={error} level="error" context={context}>
      {message}
    </ErrorMessage>
  )
}

export default TxSubmitError
