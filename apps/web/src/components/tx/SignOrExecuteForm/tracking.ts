import { trackEvent } from '@/services/analytics'
import { TX_EVENTS } from '@/services/analytics/events/transactions'
import { getTransactionTrackingType } from '@/services/analytics/tx-tracking'
import { isNestedConfirmationTxInfo } from '@/utils/transaction-guards'
import type { TransactionDetails } from '@safe-global/safe-gateway-typescript-sdk'

function getCreationEvent(args: { isParentSigner: boolean; isRoleExecution: boolean; isProposerCreation: boolean }) {
  if (args.isParentSigner) {
    return TX_EVENTS.CREATE_VIA_PARENT
  }
  if (args.isRoleExecution) {
    return TX_EVENTS.CREATE_VIA_ROLE
  }
  if (args.isProposerCreation) {
    return TX_EVENTS.CREATE_VIA_PROPOSER
  }
  return TX_EVENTS.CREATE
}

function getConfirmationEvent(args: { isParentSigner: boolean; isNestedConfirmation: boolean }) {
  if (args.isParentSigner) {
    return TX_EVENTS.CONFIRM_VIA_PARENT
  }
  if (args.isNestedConfirmation) {
    return TX_EVENTS.CONFIRM_IN_PARENT
  }
  return TX_EVENTS.CONFIRM
}

function getExecutionEvent(args: { isParentSigner: boolean; isNestedConfirmation: boolean; isRoleExecution: boolean }) {
  if (args.isParentSigner) {
    return TX_EVENTS.EXECUTE_VIA_PARENT
  }
  if (args.isNestedConfirmation) {
    return TX_EVENTS.EXECUTE_IN_PARENT
  }
  if (args.isRoleExecution) {
    return TX_EVENTS.EXECUTE_VIA_ROLE
  }
  return TX_EVENTS.EXECUTE
}

export function trackTxEvents(
  details: TransactionDetails | undefined,
  isCreation: boolean,
  isExecuted: boolean,
  isRoleExecution: boolean,
  isProposerCreation: boolean,
  isParentSigner: boolean,
  origin?: string,
  isMassPayout: boolean = false,
) {
  const isNestedConfirmation = !!details && isNestedConfirmationTxInfo(details.txInfo)

  const creationEvent = getCreationEvent({ isParentSigner, isRoleExecution, isProposerCreation })
  const confirmationEvent = getConfirmationEvent({ isParentSigner, isNestedConfirmation })
  const executionEvent = getExecutionEvent({ isParentSigner, isNestedConfirmation, isRoleExecution })

  const event = (() => {
    if (isCreation) {
      return creationEvent
    }
    if (isExecuted) {
      return executionEvent
    }
    return confirmationEvent
  })()

  const txType = getTransactionTrackingType(details, origin, isMassPayout)
  trackEvent({ ...event, label: txType })

  // Immediate execution on creation
  if (isCreation && isExecuted) {
    trackEvent({ ...executionEvent, label: txType })
  }
}
