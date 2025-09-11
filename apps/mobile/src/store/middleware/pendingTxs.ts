import { Action } from '@reduxjs/toolkit'
import { listenerMiddlewareInstance, RootState } from '..'
import { setPendingTxStatus, PendingStatus, PendingTxsState, pendingTxsSlice, clearPendingTx } from '../pendingTxsSlice'
import { selectChainById } from '../chains'
import { createWeb3ReadOnly } from '@/src/services/web3'
import { SimpleTxWatcher } from '@safe-global/utils/services/SimpleTxWatcher'
import { REHYDRATE } from 'redux-persist'
import { delay } from '@safe-global/utils/utils/helpers'
import { MiddlewareAPI } from 'redux'
import { cgwApi } from '@safe-global/store/gateway/AUTO_GENERATED/transactions'
import { SafeTxWatcher } from '@safe-global/utils/services/SafeTxWatcher'

const startIndexingWatcher = (listenerApi: MiddlewareAPI, txId: string, chainId: string) => {
  SafeTxWatcher.getInstance()
    .watchTx(txId, () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      return (listenerApi.dispatch as any)(
        cgwApi.endpoints.transactionsGetTransactionByIdV1.initiate({ chainId, id: txId }, { forceRefetch: true }),
      ).unwrap()
    })
    .then(() => {
      // TODO: Check that transaction has txStatus SUCCESS before updating state
      listenerApi.dispatch(setPendingTxStatus({ txId, chainId, status: PendingStatus.SUCCESS }))
    })
}

function isHydrateAction(action: Action): action is Action<typeof REHYDRATE> & {
  key: string
  payload: RootState
  err: unknown
} {
  return action.type === REHYDRATE
}

const runWatcher = (
  listenerApi: MiddlewareAPI,
  txHash: string,
  chainId: string,
  walletAddress: string,
  walletNonce: number,
  txId: string,
) => {
  const chain = selectChainById(listenerApi.getState(), chainId)
  const provider = chain ? createWeb3ReadOnly(chain) : undefined

  if (provider) {
    return SimpleTxWatcher.getInstance()
      .watchTxHash(txHash, walletAddress, walletNonce, provider)
      .then(() => {
        listenerApi.dispatch(setPendingTxStatus({ txId, chainId, status: PendingStatus.INDEXING }))
      })
      .catch(() => {
        listenerApi.dispatch(setPendingTxStatus({ txId, chainId, status: PendingStatus.INDEXING }))
      })
  }
}

const runWatchers = async (listenerApi: MiddlewareAPI, pendingTxs: PendingTxsState) => {
  for (const [txId, pendingTx] of Object.entries(pendingTxs)) {
    const { walletAddress, walletNonce, txHash, chainId, status } = pendingTx

    await delay(100)

    if (status === PendingStatus.INDEXING) {
      await startIndexingWatcher(listenerApi, txId, chainId)
      continue
    }

    await runWatcher(listenerApi, txHash, chainId, walletAddress, walletNonce, txId)
  }
}

export const pendingTxsListeners = (listenerMiddleware: typeof listenerMiddlewareInstance) => {
  listenerMiddleware.startListening({
    actionCreator: pendingTxsSlice.actions.addPendingTx,
    effect: (action, listenerApi) => {
      const { chainId, txHash, txId, walletAddress, walletNonce } = action.payload

      runWatcher(listenerApi, txHash, chainId, walletAddress, walletNonce, txId)
    },
  })

  listenerMiddleware.startListening({
    predicate: (action) => isHydrateAction(action),
    effect: (action, listenerApi) => {
      runWatchers(listenerApi, action.payload.pendingTxs)
    },
  })

  listenerMiddleware.startListening({
    actionCreator: pendingTxsSlice.actions.setPendingTxStatus,
    effect: async (action, listenerApi) => {
      const { status, txId, chainId } = action.payload

      if (status == PendingStatus.SUCCESS) {
        await delay(1000)
        listenerApi.dispatch(clearPendingTx({ txId }))
        listenerApi.dispatch(cgwApi.util.invalidateTags(['transactions']))
      }

      if (status === PendingStatus.INDEXING) {
        startIndexingWatcher(listenerApi, txId, chainId)
      }
    },
  })
}

export default pendingTxsListeners
