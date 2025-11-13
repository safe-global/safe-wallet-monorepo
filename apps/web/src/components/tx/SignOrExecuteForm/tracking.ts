import type { TransactionDetails } from '@safe-global/store/gateway/AUTO_GENERATED/transactions'
import { useCallback, useRef } from 'react'
import { MODALS_EVENTS, trackEvent, MixpanelEventParams } from '@/services/analytics'
import { TX_EVENTS, TX_TYPES } from '@/services/analytics/events/transactions'
import { getTransactionTrackingType } from '@/services/analytics/tx-tracking'
import { isNestedConfirmationTxInfo } from '@/utils/transaction-guards'
import type { ExtendedSafeInfo } from '@safe-global/store/slices/SafeInfo/types'

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
  trackEvent({ ...event, label: txType }, { [MixpanelEventParams.TRANSACTION_TYPE]: txType })

  // Immediate execution on creation
  if (isCreation && isExecuted) {
    trackEvent({ ...executionEvent, label: txType })
  }
}

export async function trackTransactionSubmitted(
  txId: string,
  chainId: string,
  safe: ExtendedSafeInfo,
  trigger: (arg: { chainId: string; id: string }) => Promise<{ data: TransactionDetails | undefined }>,
  origin?: string,
  isMassPayout?: boolean,
) {
  try {
    const { data: details } = await trigger({ chainId, id: txId })
    const txType = getTransactionTrackingType(details, origin, isMassPayout)
    trackEvent(
      { ...TX_EVENTS.SUBMIT, label: txType },
      {
        [MixpanelEventParams.TRANSACTION_TYPE]: txType,
        [MixpanelEventParams.THRESHOLD]: safe.threshold,
      },
    )
  } catch (error) {
    trackEvent(
      { ...TX_EVENTS.SUBMIT, label: TX_TYPES.custom },
      {
        [MixpanelEventParams.TRANSACTION_TYPE]: TX_TYPES.custom,
        [MixpanelEventParams.THRESHOLD]: safe.threshold,
      },
    )
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
