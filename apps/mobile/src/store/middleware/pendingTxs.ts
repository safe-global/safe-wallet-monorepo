import { Action } from '@reduxjs/toolkit'
import { AppListenerEffectAPI, AppStartListening, RootState } from '..'
import { setPendingTxStatus, PendingStatus, PendingTxsState, pendingTxsSlice, clearPendingTx } from '../pendingTxsSlice'
import { selectChainById } from '../chains'
import { createWeb3ReadOnly } from '@/src/services/web3'
import { SimpleTxWatcher } from '@safe-global/utils/services/SimpleTxWatcher'
import { REHYDRATE } from 'redux-persist'
import { delay } from '@safe-global/utils/utils/helpers'
import { cgwApi } from '@safe-global/store/gateway/AUTO_GENERATED/transactions'
import { SimplePoller } from '@safe-global/utils/services/SimplePoller'
import { TransactionStatus } from '@safe-global/store/gateway/types'

const startIndexingWatcher = (listenerApi: AppListenerEffectAPI, txId: string, chainId: string) => {
  const queryUntilSuccess = async () => {
    const thunk = cgwApi.endpoints.transactionsGetTransactionByIdV1.initiate(
      { chainId, id: txId },
      { forceRefetch: true },
    )
    const result = await listenerApi.dispatch(thunk).unwrap()

    if (result.txStatus === TransactionStatus.SUCCESS || result.txStatus === TransactionStatus.FAILED) {
      return
    }

    throw new Error('fetching safe tx again')
  }

  SimplePoller.getInstance()
    .watch(txId, queryUntilSuccess)
    .then(() => listenerApi.dispatch(setPendingTxStatus({ txId, chainId, status: PendingStatus.SUCCESS })))
    .catch((err) => console.log(err))
}

function isHydrateAction(action: Action): action is Action<typeof REHYDRATE> & {
  key: string
  payload: RootState
  err: unknown
} {
  return action.type === REHYDRATE
}

const runWatcher = (
  listenerApi: AppListenerEffectAPI,
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

const runWatchers = async (listenerApi: AppListenerEffectAPI, pendingTxs: PendingTxsState) => {
  for (const [txId, pendingTx] of Object.entries(pendingTxs)) {
    const { walletAddress, walletNonce, txHash, chainId, status } = pendingTx

    await delay(100)

    if (status === PendingStatus.INDEXING) {
      startIndexingWatcher(listenerApi, txId, chainId)
      continue
    }

    await runWatcher(listenerApi, txHash, chainId, walletAddress, walletNonce, txId)
  }
}

export const pendingTxsListeners = (startListening: AppStartListening) => {
  startListening({
    actionCreator: pendingTxsSlice.actions.addPendingTx,
    effect: (action, listenerApi) => {
      const { chainId, txHash, txId, walletAddress, walletNonce } = action.payload

      runWatcher(listenerApi, txHash, chainId, walletAddress, walletNonce, txId)
    },
  })

  startListening({
    predicate: (action) => isHydrateAction(action),
    effect: (action, listenerApi) => {
      runWatchers(listenerApi, action.payload.pendingTxs)
    },
  })

  startListening({
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
