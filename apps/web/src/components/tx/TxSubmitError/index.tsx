import type { ReactElement } from 'react'
import { useCurrentChain } from '@/hooks/useChains'
import { getGs026Message } from '@safe-global/utils/services/exceptions/contractErrors'
import {
  getGasLimitTooLowMessage,
  isNonceTooLowError,
  isRateLimitError,
  isRevertError,
  RATE_LIMIT_USER_MESSAGE,
} from '@/utils/transaction-errors'
import { didRevert, type EthersError } from '@/utils/ethers-utils'
import { isGs026PreCheckError } from '@/services/tx/executionPreChecks'
import { getCgwErrorInfo } from '@/utils/cgw-errors'
import ErrorMessage from '@/components/tx/ErrorMessage'
import { getLedgerDeviceError, getLedgerUserMessage } from '@/services/onboard/ledger-errors'

export const COULD_NOT_SUBMIT_MESSAGE = 'Could not submit the transaction.'
export const COULD_NOT_SUBMIT_RETRY_MESSAGE = 'Could not submit the transaction. Try again.'

export const getRevertedMessage = (network?: string): string =>
  `Transaction reverted on ${network ?? 'the network'}. Gas was spent.`

/**
 * Renders a submit/execution error.
 *
 * "Gas was spent" is claimed only on proof — a mined receipt with status 0 — never for a pre-broadcast
 * failure (which spends none). A deterministic revert gets no retry (would only waste gas); a transient one
 * does. Rate-limits keep their own copy.
 */
const TxSubmitError = ({
  error,
  context = 'execution',
}: {
  error: Error
  context?: 'estimation' | 'execution'
}): ReactElement => {
  const chain = useCurrentChain()

  // The Ledger refused before broadcast and said why — its own reason beats the generic classifications
  // below (matching the wrapped message would only rediscover viem's "unknown RPC error", WA-3243).
  const ledgerError = getLedgerDeviceError(error)
  if (ledgerError) {
    return (
      <ErrorMessage error={error} level="error" context={context}>
        {getLedgerUserMessage(ledgerError)}
      </ErrorMessage>
    )
  }

  // A failed GS026 pre-check blocked the broadcast — show its specific,
  // cause-aware message (stale nonce / not a signer / bad signature).
  if (isGs026PreCheckError(error)) {
    return (
      <ErrorMessage error={error} level="error" context={context}>
        {error.message}
      </ErrorMessage>
    )
  }

  // The signer wallet's own nonce advanced before broadcast (executed another tx meanwhile) — same story
  // as a stale Safe nonce, so show the same message. Check before revert classification: viem wraps this
  // RPC rejection as a contract revert.
  if (isNonceTooLowError(error)) {
    return (
      <ErrorMessage error={error} level="error" context={context}>
        {getGs026Message('STALE_NONCE')}
      </ErrorMessage>
    )
  }

  // The gas limit set in Advanced parameters is below the transaction's intrinsic cost, so the
  // node refused it pre-broadcast. Name the value to raise it to. Checked before the revert
  // classification for the same reason as the nonce above: viem wraps this rejection as a revert.
  const gasLimitTooLow = getGasLimitTooLowMessage(error)
  if (gasLimitTooLow) {
    return (
      <ErrorMessage error={error} level="error" context={context}>
        {gasLimitTooLow}
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

  // Known CGW response state: show the agreed copy, never the response body (may be an HTML error page),
  // and let ErrorMessage render the code-only support reference (WA-3252).
  const cgwError = getCgwErrorInfo(error)
  if (cgwError) {
    return (
      <ErrorMessage error={error} level="error" context={context}>
        {cgwError.message}
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
