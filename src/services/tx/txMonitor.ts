import { didRevert } from '@/utils/ethers-utils'
import { GelatoRelay } from '@gelatonetwork/relay-sdk'

import { txDispatch, TxEvent } from '@/services/tx/txEvents'

import type { JsonRpcProvider } from '@ethersproject/providers'
import { POLLING_INTERVAL } from '@/config/constants'

// Provider must be passed as an argument as it is undefined until initialised by `useInitWeb3`
export const waitForTx = async (provider: JsonRpcProvider, txId: string, txHash: string) => {
  const TIMEOUT_MINUTES = 6.5

  try {
    // Return receipt after 1 additional block was mined/validated or until timeout
    // https://docs.ethers.io/v5/single-page/#/v5/api/providers/provider/-%23-Provider-waitForTransaction
    const receipt = await provider.waitForTransaction(txHash, 1, TIMEOUT_MINUTES * 60_000)

    if (!receipt) {
      throw new Error(
        `Transaction not processed in ${TIMEOUT_MINUTES} minutes. Be aware that it might still be processed.`,
      )
    }

    if (didRevert(receipt)) {
      txDispatch(TxEvent.REVERTED, {
        txId,
        error: new Error(`Transaction reverted by EVM.`),
      })
    }

    // Tx successfully mined/validated but we don't dispatch SUCCESS as this may be faster than our indexer
  } catch (error) {
    txDispatch(TxEvent.FAILED, {
      txId,
      error: error as Error,
    })
  }
}

export const waitForRelayedTx = (taskId: string, txId: string): void => {
  const gelato = new GelatoRelay()

  const checkTxStatus = async () => {
    const taskStatus = await gelato.getTaskStatus(taskId)

    switch (taskStatus?.taskState) {
      case 'CheckPending':
      case 'ExecPending':
      case 'WaitingForConfirmation':
        // still pending we set a timeout to check again
        setTimeout(checkTxStatus, POLLING_INTERVAL)
        return
      case 'ExecSuccess':
        txDispatch(TxEvent.PROCESSED, {
          txId,
        })
        return
      case 'ExecReverted':
        txDispatch(TxEvent.REVERTED, {
          txId,
          error: new Error(`Relayed transaction reverted by EVM.`),
        })
        return
      case 'Blacklisted':
        txDispatch(TxEvent.FAILED, {
          txId,
          error: new Error(`Relayed transaction was blacklisted by relay provider.`),
        })
        return
      case 'Cancelled':
        txDispatch(TxEvent.FAILED, {
          txId,
          error: new Error(`Relayed transaction was cancelled by relay provider.`),
        })
        return
      case 'NotFound':
      default:
        txDispatch(TxEvent.FAILED, {
          txId,
          error: new Error(`Relayed transaction was not found.`),
        })
        return
    }
  }

  setTimeout(checkTxStatus, 2000)
}
