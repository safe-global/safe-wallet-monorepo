import { useEffect, useMemo, useState } from 'react'
import { useSafesGetNoncesV1Query } from '@safe-global/store/gateway/AUTO_GENERATED/safes'
import { useTransactionsGetTransactionQueueV1Query } from '@safe-global/store/gateway/AUTO_GENERATED/transactions'
import { Typography } from '@safe-global/views/components/ui/typography'
import { NonceOptionLabel, NonceRow, NonceSkeleton, TxNonceForm } from '@/components/tx-flow/common/TxNonce'
import { useWalletContext } from '@/hooks/wallets/useWallet'
import useSafeInfo from '@/hooks/useSafeInfo'
import { getQueuedNonces } from '@/hooks/usePreviousNonces'
import { filterQueuedTransactionsByNonce } from '@/store/txQueueSlice'
import { POLLING_INTERVAL } from '@/config/constants'

// The nonce of the tx the parent Safe creates to sign or execute the current Safe's tx
export const ParentSafeNonce = ({ parentSafeAddress }: { parentSafeAddress: string }) => {
  const { safe } = useSafeInfo()
  const setParentSafeNonce = useWalletContext()?.setParentSafeNonce
  const parentSafe = { chainId: safe.chainId, safeAddress: parentSafeAddress }
  const polling = { pollingInterval: POLLING_INTERVAL, refetchOnMountOrArgChange: true }
  const { currentData: nonces, isError } = useSafesGetNoncesV1Query(parentSafe, polling)
  const { currentData: queue } = useTransactionsGetTransactionQueueV1Query(parentSafe, polling)
  const [chosenNonce, setChosenNonce] = useState<number>()
  const nonce = chosenNonce ?? nonces?.recommendedNonce
  const queuedNonces = useMemo(() => getQueuedNonces(queue), [queue])

  // Only a nonce the user chose: the default is re-fetched when the tx is created, so it can't be stale
  useEffect(() => {
    setParentSafeNonce?.(chosenNonce)
    return () => setParentSafeNonce?.(undefined)
  }, [chosenNonce, setParentSafeNonce])

  if (isError) {
    return <Typography variant="paragraph-small">Couldn&apos;t load the parent Safe nonce</Typography>
  }

  return (
    <NonceRow label="Parent Safe nonce" testId="parent-safe-nonce-fld">
      {nonces === undefined || nonce === undefined ? (
        <NonceSkeleton />
      ) : (
        <TxNonceForm
          nonce={nonce.toString()}
          recommendedNonce={nonces.recommendedNonce.toString()}
          currentNonce={nonces.currentNonce}
          previousNonces={queuedNonces}
          readOnly={false}
          onNonceChange={setChosenNonce}
          renderOption={(option) => (
            <NonceOptionLabel nonce={option} transactions={filterQueuedTransactionsByNonce(queue, Number(option))} />
          )}
        />
      )}
    </NonceRow>
  )
}

export default ParentSafeNonce
