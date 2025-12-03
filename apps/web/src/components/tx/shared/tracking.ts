import type { TransactionDetails } from '@safe-global/store/gateway/AUTO_GENERATED/transactions'
import { useCallback, useRef } from 'react'
import { MODALS_EVENTS, trackEvent, MixpanelEventParams } from '@/services/analytics'
import { TX_EVENTS } from '@/services/analytics/events/transactions'
import { getTransactionTrackingType } from '@/services/analytics/tx-tracking'
import { isNestedConfirmationTxInfo } from '@/utils/transaction-guards'

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
  threshold?: number,
) {
  const isNestedConfirmation = !!details && isNestedConfirmationTxInfo(details.txInfo)

  const creationEvent = getCreationEvent({ isParentSigner, isRoleExecution, isProposerCreation })
  const confirmationEvent = getConfirmationEvent({ isParentSigner, isNestedConfirmation })
  const executionEvent = getExecutionEvent({ isParentSigner, isNestedConfirmation, isRoleExecution })

  const txType = getTransactionTrackingType(details, origin, isMassPayout)

  // Build Mixpanel properties for events that need them
  const getMixpanelProperties = () => {
    const properties: Record<string, string | number | undefined> = {
      [MixpanelEventParams.TRANSACTION_TYPE]: txType,
    }
    if (threshold !== undefined) {
      properties[MixpanelEventParams.THRESHOLD] = threshold
    }
    return properties
  }

  if (isCreation) {
    // Track "Transaction Submitted" to Mixpanel with properties
    trackEvent({ ...creationEvent, label: txType }, getMixpanelProperties())

    // If also executed immediately, track "Transaction Executed" with properties
    if (isExecuted) {
      trackEvent({ ...executionEvent, label: txType }, getMixpanelProperties())
    }
  } else if (isExecuted) {
    // Track "Transaction Executed" to Mixpanel with properties
    trackEvent({ ...executionEvent, label: txType }, getMixpanelProperties())
  } else {
    // Confirmation - no Mixpanel properties
    trackEvent({ ...confirmationEvent, label: txType })
  }
}

export function useTrackTimeSpent() {
  const startTime = useRef(Date.now())

  return useCallback(() => {
    const secondsElapsed = Math.round((Date.now() - startTime.current) / 1000)

    trackEvent({
      ...MODALS_EVENTS.RECEIPT_TIME_SPENT,
      label: secondsElapsed,
    })
  }, [startTime])
}
