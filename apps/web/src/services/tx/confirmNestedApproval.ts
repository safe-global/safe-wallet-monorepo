import type { SafeTransaction } from '@safe-global/types-kit'
import { Safe__factory } from '@safe-global/utils/types/contracts'
import { generatePreValidatedSignature } from '@safe-global/protocol-kit'
import addConfirmation from '@/services/tx/addConfirmation'
import { txSubscribe, TxEvent } from '@/services/tx/txEvents'
import { logError, Errors } from '@/services/exceptions'

const safeInterface = Safe__factory.createInterface()
const approveHashSelector = safeInterface.getFunction('approveHash').selector

/**
 * Decode `{ childSafeAddress, childSafeTxHash }` from a parent Safe's `approveHash` transaction.
 *
 * In the nested flow, `TX_P` is `P.execTransaction(to=C, data=approveHash(childSafeTxHash))`, so the
 * inner safeTx carries the child address as `to` and the child hash inside the `approveHash` calldata.
 * Returns undefined for any tx that isn't an `approveHash` call.
 */
export const decodeNestedApproval = (
  safeTx: SafeTransaction,
): { childSafeAddress: string; childSafeTxHash: string } | undefined => {
  const hexData = safeTx.data.data
  if (!hexData?.startsWith(approveHashSelector)) {
    return undefined
  }

  const [childSafeTxHash] = safeInterface.decodeFunctionData('approveHash', hexData)

  return { childSafeAddress: safeTx.data.to, childSafeTxHash }
}

/**
 * After a parent Safe's relayed `approveHash` (`TX_P`) is executed, proactively submit the parent's
 * pre-validated confirmation to the child Safe's transaction so the approval shows on `C` immediately
 * instead of waiting for the gateway to index the on-chain event.
 *
 * No-op for any tx that isn't a nested `approveHash`. Subscribes one-shot to `PROCESSED` for the
 * parent tx; self-cleaning on success or terminal failure.
 */
export const confirmNestedApprovalOnExecution = (
  parentTxId: string,
  parentSafeAddress: string,
  childChainId: string,
  safeTx: SafeTransaction,
): void => {
  const decoded = decodeNestedApproval(safeTx)
  if (!decoded) {
    return
  }

  const signature = generatePreValidatedSignature(parentSafeAddress).data

  const unsubscribe = txSubscribe(TxEvent.PROCESSED, async (detail) => {
    if (detail.txId !== parentTxId) {
      return
    }

    unsubscribe()

    try {
      await addConfirmation(childChainId, decoded.childSafeTxHash, signature)
    } catch (error) {
      logError(Errors._822, error)
    }
  })
}
