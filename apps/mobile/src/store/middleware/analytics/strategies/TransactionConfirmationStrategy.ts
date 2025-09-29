import { RootState } from '@/src/store'
import { MiddlewareAPI, Dispatch } from 'redux'
import { Strategy, ActionWithPayload } from '@/src/store/utils/strategy/Strategy'
import { trackEvent } from '@/src/services/analytics'
import { getTransactionAnalyticsLabel } from '@/src/services/analytics/utils'
import { createTxConfirmEvent } from '@/src/services/analytics/events/transactions'
import type { Transaction } from '@safe-global/store/gateway/AUTO_GENERATED/transactions'

export class TransactionConfirmationStrategy implements Strategy<RootState, MiddlewareAPI<Dispatch, RootState>> {
  execute(_store: MiddlewareAPI<Dispatch, RootState>, action: ActionWithPayload): void {
    const confirmedTransaction = action.payload

    if (
      confirmedTransaction &&
      typeof confirmedTransaction === 'object' &&
      'txInfo' in confirmedTransaction &&
      confirmedTransaction.txInfo
    ) {
      const analyticsLabel = getTransactionAnalyticsLabel(confirmedTransaction.txInfo as Transaction['txInfo'])
      trackEvent(createTxConfirmEvent(analyticsLabel))
    }
  }
}
