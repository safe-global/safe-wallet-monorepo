import { useEffect, useMemo, useState } from 'react'
import { useSafesGetNoncesV1Query } from '@safe-global/store/gateway/AUTO_GENERATED/safes'
import {
  useTransactionsGetTransactionQueueV1Query,
  type QueuedItemPage,
} from '@safe-global/store/gateway/AUTO_GENERATED/transactions'
import { Typography } from '@safe-global/views/components/ui/typography'
import { NonceOptionLabel, NonceRow, NonceSkeleton, TxNonceForm } from '@/components/tx-flow/common/TxNonce'
import { useWalletContext } from '@/hooks/wallets/useWallet'
import useSafeInfo from '@/hooks/useSafeInfo'
import { getQueuedNonces } from '@/hooks/usePreviousNonces'
import { filterQueuedTransactionsByNonce } from '@/store/txQueueSlice'
import { POLLING_INTERVAL } from '@/config/constants'

const POLLING_OPTIONS = { pollingInterval: POLLING_INTERVAL, refetchOnMountOrArgChange: true }

const QueuedNonceOption = ({ nonce, queue }: { nonce: string; queue?: QueuedItemPage }) => {
  const transactions = useMemo(() => filterQueuedTransactionsByNonce(queue, Number(nonce)), [queue, nonce])
  return <NonceOptionLabel nonce={nonce} transactions={transactions} />
}

export const ParentSafeNonce = ({ parentSafeAddress }: { parentSafeAddress: string }) => {
  const { safe } = useSafeInfo()
  const { setParentSafeNonce, clearParentSafeNonce } = useWalletContext() ?? {}
  const parentSafe = { chainId: safe.chainId, safeAddress: parentSafeAddress }
  const { currentData: nonces, isError } = useSafesGetNoncesV1Query(parentSafe, POLLING_OPTIONS)
  const { currentData: queue } = useTransactionsGetTransactionQueueV1Query(parentSafe, POLLING_OPTIONS)
  const [chosenNonce, setChosenNonce] = useState<number>()
  const queuedNonces = useMemo(() => getQueuedNonces(queue), [queue])

  useEffect(() => clearParentSafeNonce, [clearParentSafeNonce])

  if (nonces === undefined) {
    return isError ? (
      <Typography variant="paragraph-small">Couldn&apos;t load the parent Safe nonce</Typography>
    ) : (
      <NonceRow label="Parent Safe nonce" testId="parent-safe-nonce-fld">
        <NonceSkeleton />
      </NonceRow>
    )
  }

  // The recommended nonce is not pinned: the signer fetches it again when it creates the tx
  const chooseNonce = (nonce: number) => {
    if (nonce === nonces.recommendedNonce) {
      setChosenNonce(undefined)
      clearParentSafeNonce?.()
      return
    }
    setChosenNonce(nonce)
    setParentSafeNonce?.(nonce)
  }

  const nonce = chosenNonce ?? nonces.recommendedNonce

  return (
    <NonceRow label="Parent Safe nonce" testId="parent-safe-nonce-fld">
      <TxNonceForm
        nonce={nonce.toString()}
        recommendedNonce={nonces.recommendedNonce.toString()}
        currentNonce={nonces.currentNonce}
        queuedNonces={queuedNonces}
        readOnly={false}
        onNonceChange={chooseNonce}
        renderOption={(option) => <QueuedNonceOption nonce={option} queue={queue} />}
      />
    </NonceRow>
  )
}

export default ParentSafeNonce
