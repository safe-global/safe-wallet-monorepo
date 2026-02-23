import { Action } from '@reduxjs/toolkit'
import { AppListenerEffectAPI, AppStartListening, RootState } from '..'
import {
  setPendingTxStatus,
  PendingStatus,
  PendingTxsState,
  pendingTxsSlice,
  clearPendingTx,
  setRelayTxHash,
  selectPendingTxById,
} from '../pendingTxsSlice'
import { ExecutionMethod } from '@/src/features/HowToExecuteSheet/types'
import { selectChainById } from '../chains'
import { createWeb3ReadOnly } from '@/src/services/web3'
import { SimpleTxWatcher } from '@safe-global/utils/services/SimpleTxWatcher'
import { RelayTxWatcher, TIMEOUT_ERROR_CODE } from '@safe-global/utils/services/RelayTxWatcher'
import { REHYDRATE } from 'redux-persist'
import { delay } from '@safe-global/utils/utils/helpers'
import { cgwApi } from '@safe-global/store/gateway/AUTO_GENERATED/transactions'
import { SimplePoller } from '@safe-global/utils/services/SimplePoller'
import { TransactionStatus } from '@safe-global/store/gateway/types'
import logger from '@/src/utils/logger'
import { getBaseUrl } from '@safe-global/store/gateway/cgwClient'

const cleanUpPendingTx = (listenerApi: AppListenerEffectAPI, txId: string) => {
  listenerApi.dispatch(clearPendingTx({ txId }))
  listenerApi.dispatch(cgwApi.util.invalidateTags(['transactions']))
}

const handleRelayWatcherError = (
  listenerApi: AppListenerEffectAPI,
  txId: string,
  taskId: string,
  chainId: string,
  err: unknown,
) => {
  const errorMessage = err instanceof Error ? err.message : String(err)
  listenerApi.dispatch(setPendingTxStatus({ txId, chainId, status: PendingStatus.FAILED, error: errorMessage }))

  if (err instanceof Error && err.cause === TIMEOUT_ERROR_CODE) {
    setTimeout(() => {
      cleanUpPendingTx(listenerApi, txId)
    }, 1000)
  }

  logger.error('Relay watcher error', { txId, taskId, error: err })
}

/***
 * Gelato endpoint is not reliable at times
 * and sometimes it returns no response yet the transaction might have been submitted to the blockchain.
 *
 * Case 1: Transaction was executed but since we're not getting response from Gelato,
 * we would be polling it for 3 minutes. For the user it would be like the transaction is stuck.
 *
 * That is why the relayer is running together with the indexing watcher.
 * IF the indexing watcher finds out that the transaction was executed successfully,
 * the Gelato watcher will be stopped.
 *
 * Case 2: The transaction was not successful executed we would be polling it for 3 minutes,
 *  both relayer and indexer,
 *  but after 3 minutes the Gelato watcher is gonna timeout and clean up the transaction from pending
 *
 *
 */
const startRelayWatcher = (listenerApi: AppListenerEffectAPI, txId: string, taskId: string, chainId: string) => {
  const baseUrl = getBaseUrl()
  if (!baseUrl) {
    logger.error('CGW base URL not configured for relay watcher', { txId, taskId })
    listenerApi.dispatch(
      setPendingTxStatus({ txId, chainId, status: PendingStatus.FAILED, error: 'CGW base URL not configured' }),
    )
    return
  }

  const instance = RelayTxWatcher.getInstance()

  instance
    .watchTaskId(taskId, chainId, baseUrl, {
      onNextPoll: () => {
        const pendingTx = selectPendingTxById(listenerApi.getState(), txId)

        if (!pendingTx) {
          instance.stopWatchingTaskId(taskId)
        }
      },
    })
    .then((relayStatus) => {
      const txHash = relayStatus.receipt?.transactionHash
      logger.info('Relay transaction completed', { txId, taskId, txHash })

      if (txHash) {
        listenerApi.dispatch(setRelayTxHash({ txId, txHash }))
        listenerApi.dispatch(setPendingTxStatus({ txId, chainId, status: PendingStatus.INDEXING }))
      }
    })
    .catch((err) => {
      handleRelayWatcherError(listenerApi, txId, taskId, chainId, err)
    })
}

const startIndexingWatcher = (listenerApi: AppListenerEffectAPI, txId: string, chainId: string) => {
  const queryUntilSuccess = async () => {
    const pendingTx = selectPendingTxById(listenerApi.getState(), txId)

    if (!pendingTx) {
      return
    }

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
  payload: Partial<RootState> | undefined
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
      startIndexingWatcher(listenerApi, txId, chainId)
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
        startIndexingWatcher(listenerApi, txId, chainId)
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
      const pendingTxs = action.payload?.pendingTxs
      if (pendingTxs) {
        runWatchers(listenerApi, pendingTxs)
      }
    },
  })

  startListening({
    actionCreator: pendingTxsSlice.actions.setPendingTxStatus,
    effect: async (action, listenerApi) => {
      const { status, txId, chainId } = action.payload

      if (status == PendingStatus.SUCCESS) {
        await delay(1000)
        cleanUpPendingTx(listenerApi, txId)
      }

      if (status === PendingStatus.INDEXING) {
        startIndexingWatcher(listenerApi, txId, chainId)
      }
    },
  })
}

export default pendingTxsListeners
