import { type PendingProcessingTx, PendingStatus, type PendingTx } from '@/store/pendingTxsSlice'
import { sameAddress } from '@safe-global/utils/utils/addresses'

export const isSpeedableTx = (
  pendingTx: PendingTx,
  isSmartContract: boolean | undefined,
  walletAddress: string,
): pendingTx is PendingProcessingTx => {
  return (
    pendingTx.status === PendingStatus.PROCESSING &&
    sameAddress(pendingTx.signerAddress, walletAddress) &&
    !isSmartContract
  )
}
