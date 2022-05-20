import type { ThunkMiddleware } from 'redux-thunk'

import type { RootState } from '@/store'
import {
  setTxFailed,
  setTxMined,
  setTxMining,
  setTxSubmitting,
  removePendingTx,
  selectPendingTxById,
} from '@/store/pendingTxsSlice'
import { showNotification } from '@/store/notificationsSlice'
import { isTransaction } from '@/components/transactions/utils'
import { setHistoryPage } from './txHistorySlice'

export const notificationsMiddleware: ThunkMiddleware<RootState> =
  ({ dispatch, getState }) =>
  (next) =>
  (action) => {
    const result = next(action)
    const state = getState()

    switch (action.type) {
      // case setTxCreated.type: {
      //     break
      // }
      // case setTxSigned.type: {
      //     break
      // }
      // case setTxProposed.type: {
      //     break
      // }
      case setTxSubmitting.type: {
        dispatch(
          showNotification({
            message: 'Your transaction is being submitted to the Mempool.',
          }),
        )
        break
      }
      case setTxMining.type: {
        dispatch(
          showNotification({
            message: 'Your transaction is in the Mempool and is waiting to be mined.',
          }),
        )
        break
      }
      case setTxMined.type: {
        const didRevert = action.payload.receipt.status === false

        const notification: Parameters<typeof showNotification>[0] = didRevert
          ? {
              message: 'Your transaction was reverted by the EVM.',
              options: { variant: 'error' },
            }
          : {
              message: 'Your transaction was succesfully mined! It is now being indexed by our transaction service.',
              options: { variant: 'success' },
            }

        dispatch(showNotification(notification))
        break
      }
      // Transaction was loaded into historical list
      case setHistoryPage.type: {
        if (!action.payload) {
          break
        }

        for (const result of action.payload.results) {
          if (!isTransaction(result)) {
            continue
          }

          const { id } = result.transaction

          const pendingTx = selectPendingTxById(state, id)
          if (!pendingTx) {
            continue
          }

          dispatch(
            showNotification({
              message:
                'Your transaction was successfully indexed! It is now viewable in the historical transaction list.',
              options: { variant: 'success' },
            }),
          )

          // TODO: This needs to be moved
          dispatch(removePendingTx({ txId: id }))
        }
        break
      }
      case setTxFailed.type: {
        dispatch(
          showNotification({
            message: `Your transaction was unsuccessful. ${action.payload.error.message}`,
            options: { persist: true, variant: 'error' },
          }),
        )
        break
      }
    }

    return result
  }
