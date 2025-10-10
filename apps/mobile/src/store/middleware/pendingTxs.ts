import { Action } from '@reduxjs/toolkit'
import { AppListenerEffectAPI, AppStartListening, RootState } from '..'
import {
  setPendingTxStatus,
  PendingStatus,
  PendingTxsState,
  pendingTxsSlice,
  clearPendingTx,
  setRelayTxHash,
} from '../pendingTxsSlice'
import { ExecutionMethod } from '@/src/features/HowToExecuteSheet/types'
import { selectChainById } from '../chains'
import { createWeb3ReadOnly } from '@/src/services/web3'
import { SimpleTxWatcher } from '@safe-global/utils/services/SimpleTxWatcher'
import { RelayTxWatcher } from '@safe-global/utils/services/RelayTxWatcher'
import { REHYDRATE } from 'redux-persist'
import { delay } from '@safe-global/utils/utils/helpers'
import { cgwApi } from '@safe-global/store/gateway/AUTO_GENERATED/transactions'
import { SimplePoller } from '@safe-global/utils/services/SimplePoller'
import { TransactionStatus } from '@safe-global/store/gateway/types'
import logger from '@/src/utils/logger'

const startRelayWatcher = (listenerApi: AppListenerEffectAPI, txId: string, taskId: string, chainId: string) => {
  RelayTxWatcher.getInstance()
    .watchTaskId(taskId)
    .then((task) => {
      // Transaction executed successfully, move to indexing
      logger.info('Relay transaction completed', { txId, taskId, txHash: task.transactionHash })

      if (task.transactionHash && task.transactionHash !== '') {
        listenerApi.dispatch(setRelayTxHash({ txId, txHash: task.transactionHash }))
        listenerApi.dispatch(setPendingTxStatus({ txId, chainId, status: PendingStatus.INDEXING }))
      }
    })
    .catch((err) => {
      logger.error('Relay watcher error', { txId, taskId, error: err })
    })
}

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
    await delay(100)

    const { chainId, status } = pendingTx

    if (status === PendingStatus.INDEXING) {
      startIndexingWatcher(listenerApi, txId, chainId)
      continue
    }

    // Handle relay transactions
    if (pendingTx.type === ExecutionMethod.WITH_RELAY) {
      startRelayWatcher(listenerApi, txId, pendingTx.taskId, chainId)
      continue
    }

    // Handle single transactions
    if (pendingTx.type === ExecutionMethod.WITH_PK) {
      const { walletAddress, walletNonce, txHash } = pendingTx
      await runWatcher(listenerApi, txHash, chainId, walletAddress, walletNonce, txId)
    }
  }
}

export const pendingTxsListeners = (startListening: AppStartListening) => {
  startListening({
    actionCreator: pendingTxsSlice.actions.addPendingTx,
    effect: (action, listenerApi) => {
      const { txId, chainId } = action.payload

      if (action.payload.type === ExecutionMethod.WITH_RELAY) {
        startRelayWatcher(listenerApi, txId, action.payload.taskId, chainId)
      } else if (action.payload.type === ExecutionMethod.WITH_PK) {
        const { txHash, walletAddress, walletNonce } = action.payload
        runWatcher(listenerApi, txHash, chainId, walletAddress, walletNonce, txId)
      }
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
