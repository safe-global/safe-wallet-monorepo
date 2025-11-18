import type { listenerMiddlewareInstance } from '@/store'
import type { OrderStatuses } from '@safe-global/store/gateway/types'
import { createSelector, createSlice } from '@reduxjs/toolkit'
import type { RootState } from '@/store'
import { isSwapOrderTxInfo, isTransactionListItem } from '@/utils/transaction-guards'
import { cgwApi as safesApi } from '@safe-global/store/gateway/AUTO_GENERATED/safes'
import { cgwApi as chainsApi } from '@safe-global/store/gateway/AUTO_GENERATED/chains'
import { cgwApi as transactionsApi } from '@safe-global/store/gateway/AUTO_GENERATED/transactions'
import { showNotification } from '@/store/notificationsSlice'
import { getTxLink } from '@/utils/tx-link'

type AllStatuses = OrderStatuses | 'created'
type Order = {
  orderUid: string
  status: AllStatuses
  txId?: string
  chainId?: string
  safeAddress?: string
}

type SwapOrderState = {
  [orderUid: string]: Order
}

const initialState: SwapOrderState = {}

const slice = createSlice({
  name: 'swapOrders',
  initialState,
  reducers: {
    setSwapOrder: (state, { payload }: { payload: Order }): SwapOrderState => {
      return {
        ...state,
        [payload.orderUid]: {
          ...state[payload.orderUid],
          ...payload,
        },
      }
    },
    deleteSwapOrder: (state, { payload }: { payload: string }): SwapOrderState => {
      const newState = { ...state }
      delete newState[payload]
      return newState
    },
  },
})

export const { setSwapOrder, deleteSwapOrder } = slice.actions
const selector = (state: RootState) => state[slice.name]
export const swapOrderSlice = slice
export const selectAllSwapOrderStatuses = selector

export const selectSwapOrderStatus = createSelector(
  [selectAllSwapOrderStatuses, (_, uid: string) => uid],
  (allOrders, uid): undefined | AllStatuses => {
    return allOrders ? allOrders[uid]?.status : undefined
  },
)

const groupKey = 'swap-order-status'
/**
 * Listen for changes in the swap order status and determines if a notification should be shown
 *
 * Some gotchas:
 * If the status of an order is created, presignaturePending, open - we always display a notification.
 * Here it doesn't matter if the order was started through the UI or the gateway returned that order on a new browser instance.
 *
 * For fulfilled, expired, cancelled - we only display a notification if the old status is not undefined.
 * Why? Because if the status is undefined, it means that the order was just fetched from the gateway, and
 * it was already processed and there is no need to show a notification. If the status is != undefined, it means
 * that the user has started the swap through the UI (or has continued it from a previous state), and we should show a notification.
 *
 * @param listenerMiddleware
 */
export const swapOrderStatusListener = (listenerMiddleware: typeof listenerMiddlewareInstance) => {
  listenerMiddleware.startListening({
    actionCreator: slice.actions.setSwapOrder,
    effect: (action, listenerApi) => {
      const { dispatch, getState } = listenerApi
      const swapOrder = action.payload
      const oldStatus = selectSwapOrderStatus(listenerApi.getOriginalState(), swapOrder.orderUid)
      const newStatus = swapOrder.status

      if (oldStatus === newStatus || newStatus === undefined) {
        return
      }

      // Access safeInfo and chains from RTK Query cache
      const state = getState()
      let threshold: number | undefined
      let link: ReturnType<typeof getTxLink> | undefined

      if (swapOrder.chainId && swapOrder.safeAddress) {
        // RTK Query select expects specific RootState shape with API reducers
        const safeInfoState = safesApi.endpoints.safesGetSafeV1.select({
          chainId: swapOrder.chainId,
          safeAddress: swapOrder.safeAddress,
          // @ts-ignore
        })(state)
        // @ts-ignore
        const chainsState = chainsApi.endpoints.chainsGetChainsV1.select({})(state)

        threshold = safeInfoState.data?.threshold

        if (swapOrder.txId && safeInfoState.data?.address) {
          const chainInfo = chainsState.data?.results?.find((c) => c.chainId === swapOrder.chainId)
          if (chainInfo !== undefined) {
            link = getTxLink(swapOrder.txId, chainInfo, safeInfoState.data.address.value)
          }
        }
      }

      switch (newStatus) {
        case 'created':
          dispatch(
            showNotification({
              title: 'Order created',
              message:
                threshold === 1
                  ? 'Waiting for the transaction to be executed'
                  : 'Waiting for confirmation from signers of your Safe',
              groupKey,
              variant: 'info',
              link,
            }),
          )

          break
        case 'presignaturePending':
          dispatch(
            showNotification({
              title: 'Order waiting for signature',
              message: 'Waiting for confirmation from signers of your Safe',
              groupKey,
              variant: 'info',
              link,
            }),
          )
          break
        case 'open':
          dispatch(
            showNotification({
              title: 'Order transaction confirmed',
              message: 'Waiting for order execution by the CoW Protocol',
              groupKey,
              variant: 'info',
              link,
            }),
          )
          break
        case 'fulfilled':
          dispatch(slice.actions.deleteSwapOrder(swapOrder.orderUid))
          if (oldStatus === undefined) {
            return
          }
          dispatch(
            showNotification({
              title: 'Order executed',
              message: 'Your order has been successful',
              groupKey,
              variant: 'success',
              link,
            }),
          )
          break
        case 'expired':
          dispatch(slice.actions.deleteSwapOrder(swapOrder.orderUid))
          if (oldStatus === undefined) {
            return
          }
          dispatch(
            showNotification({
              title: 'Order expired',
              message: 'Your order has reached the expiry time and has become invalid',
              groupKey,
              variant: 'warning',
              link,
            }),
          )
          break
        case 'cancelled':
          dispatch(slice.actions.deleteSwapOrder(swapOrder.orderUid))
          if (oldStatus === undefined) {
            return
          }
          dispatch(
            showNotification({
              title: 'Order cancelled',
              message: 'Your order has been cancelled',
              groupKey,
              variant: 'warning',
              link,
            }),
          )
          break
      }
    },
  })
}

/**
 * Listen for changes in the tx history, check if the transaction is a swap order and update the status of the order
 * @param listenerMiddleware
 */
export const swapOrderListener = (listenerMiddleware: typeof listenerMiddlewareInstance) => {
  // Check if endpoint exists before setting up listener (may not exist in test environment)
  if (!transactionsApi.endpoints?.transactionsGetTransactionsHistoryV1?.matchFulfilled) {
    return
  }

  listenerMiddleware.startListening({
    matcher: transactionsApi.endpoints.transactionsGetTransactionsHistoryV1.matchFulfilled,
    effect: (action, listenerApi) => {
      if (!action.payload) {
        return
      }

      // Get chainId and safeAddress from the query args
      const { chainId, safeAddress } = action.meta.arg.originalArgs

      for (const result of action.payload.results) {
        if (!isTransactionListItem(result)) {
          continue
        }

        if (isSwapOrderTxInfo(result.transaction.txInfo)) {
          const swapOrder = result.transaction.txInfo
          const oldStatus = selectSwapOrderStatus(listenerApi.getOriginalState(), swapOrder.uid)

          const finalStatuses: AllStatuses[] = ['fulfilled', 'expired', 'cancelled']
          if (oldStatus === swapOrder.status || (oldStatus === undefined && finalStatuses.includes(swapOrder.status))) {
            continue
          }

          listenerApi.dispatch({
            type: slice.actions.setSwapOrder.type,
            payload: {
              orderUid: swapOrder.uid,
              status: swapOrder.status,
              txId: result.transaction.id,
              chainId,
              safeAddress,
            },
          })
        }
      }
    },
  })
}
