import { SAFENET_API_URL } from '@/config/constants'
import { txDispatch, TxEvent } from '@/services/tx/txEvents'
import { type SafenetTransactionDetails } from '@/store/safenet'

const SAFENET_TIMEOUT = 5 * 60_000 // 5 minutes
const POLLING_INTERVAL = 5_000

export const waitForSafenetTx = async (
  txId: string,
  safeTxHash: string,
  chainId: string,
  nonce: number,
  safeAddress: string,
) => {
  let intervalId: NodeJS.Timeout
  let failAfterTimeoutId: NodeJS.Timeout

  intervalId = setInterval(async () => {
    const txDetails = await fetch(`${SAFENET_API_URL}/api/v1/tx/details/${chainId}/${safeTxHash}`)
      .then((resp) => {
        if (resp.ok) {
          return resp.json()
        } else {
          return undefined
        }
      })
      .then((resp) => {
        if (resp) {
          return resp as SafenetTransactionDetails
        }
      })

    if (txDetails && txDetails.fulfillmentTxHash) {
      txDispatch(TxEvent.PROCESSED, {
        safeAddress,
        nonce,
        txHash: txDetails.fulfillmentTxHash,
        txId,
      })
      clearInterval(intervalId)
      clearTimeout(failAfterTimeoutId)
    }
  }, POLLING_INTERVAL)

  failAfterTimeoutId = setTimeout(() => {
    txDispatch(TxEvent.FAILED, {
      nonce,
      txId,
      error: new Error(
        `Transaction not processed in ${SAFENET_TIMEOUT / 60_000} minutes. Be aware that it might still be relayed.`,
      ),
    }),
      clearInterval(intervalId)
  }, SAFENET_TIMEOUT)
}
