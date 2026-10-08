import { useState, useEffect } from 'react'
import { PendingStatus, selectPendingTxById } from '@/store/pendingTxsSlice'
import EthHashInfo from '@/components/common/EthHashInfo'
import useAddressBook from '@/hooks/useAddressBook'
import { AppRoutes } from '@/config/routes'
import { useAppSelector } from '@/store'
import useAsync from '@safe-global/utils/hooks/useAsync'
import { getSafeTransaction } from '@/utils/transactions'
import { isMultisigDetailedExecutionInfo } from '@/utils/transaction-guards'
import { useUrlSpaceId, withSpaceId } from '@/hooks/useUrlSpaceId'
import {
  NestedTxSuccessScreenNotFoundView,
  NestedTxSuccessScreenView,
} from '@views/components/tx-flow/flows/NestedTxSuccessScreen/NestedTxSuccessScreenView'

type Props = {
  txId: string
}
const NestedTxSuccessScreen = ({ txId }: Props) => {
  const addressBook = useAddressBook()
  const spaceId = useUrlSpaceId()

  // _pendingTx eventually clears from the store, so we need to cache it
  const _pendingTx = useAppSelector((state) => (txId ? selectPendingTxById(state, txId) : undefined))
  const [cachedPendingTx, setCachedPendingTx] = useState(_pendingTx)
  useEffect(() => {
    if (_pendingTx) {
      setCachedPendingTx(_pendingTx)
    }
  }, [_pendingTx])

  const [safeTx] = useAsync(() => {
    if (cachedPendingTx?.status == PendingStatus.NESTED_SIGNING) {
      return getSafeTransaction(
        cachedPendingTx.txHashOrParentSafeTxHash,
        cachedPendingTx.chainId,
        cachedPendingTx.signerAddress,
      )
    }
  }, [cachedPendingTx])
  const isSafeTxHash =
    cachedPendingTx?.status == PendingStatus.NESTED_SIGNING &&
    !!safeTx &&
    isMultisigDetailedExecutionInfo(safeTx.detailedExecutionInfo) &&
    safeTx.detailedExecutionInfo.safeTxHash === cachedPendingTx.txHashOrParentSafeTxHash

  if (cachedPendingTx?.status !== PendingStatus.NESTED_SIGNING) {
    return <NestedTxSuccessScreenNotFoundView />
  }

  const currentSafeAddress = addressBook[cachedPendingTx.safeAddress]
  const parentSafeAddress = addressBook[cachedPendingTx.signerAddress]

  const href = isSafeTxHash
    ? {
        pathname: AppRoutes.transactions.tx,
        query: withSpaceId(
          {
            safe: cachedPendingTx.signerAddress,
            chainId: cachedPendingTx.chainId,
            id: cachedPendingTx.txHashOrParentSafeTxHash,
          },
          spaceId,
        ),
      }
    : {
        pathname: AppRoutes.transactions.queue,
        query: withSpaceId({ safe: cachedPendingTx.signerAddress, chainId: cachedPendingTx.chainId }, spaceId),
      }

  return (
    <NestedTxSuccessScreenView
      parentSafe={{ address: cachedPendingTx.signerAddress, name: parentSafeAddress }}
      currentSafe={{ address: cachedPendingTx.safeAddress, name: currentSafeAddress }}
      href={href}
      renderAddress={(props) => <EthHashInfo {...props} />}
    />
  )
}

export default NestedTxSuccessScreen
