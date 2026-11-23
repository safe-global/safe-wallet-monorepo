import type { ReactElement } from 'react'
import type { Transaction } from '@safe-global/store/gateway/AUTO_GENERATED/transactions'
import { sameAddress } from '@safe-global/utils/utils/addresses'
import PendingChip, {
  getPendingHint,
  type PendingPhase,
} from '@safe-global/views/features/spaces/components/SpaceQueue/PendingChip'
import NonceTakenButton from '@safe-global/views/features/spaces/components/SpaceQueue/NonceTakenButton'
import SpeedUpMonitor from '@/features/speedup/public/components/SpeedUpMonitor'
import useIsSpeedUpAvailable from '@/features/speedup/public/hooks/useIsSpeedUpAvailable'
import useNow from '@/hooks/useNow'
import { useAppSelector } from '@/store'
import { PendingStatus, selectPendingTxs, type PendingTx, type PendingTxsState } from '@/store/pendingTxsSlice'
import { isAwaitingExecution } from '@/utils/transaction-guards'

const EXECUTING: ReadonlySet<PendingStatus> = new Set([
  PendingStatus.SUBMITTING,
  PendingStatus.PROCESSING,
  PendingStatus.RELAYING,
  PendingStatus.INDEXING,
])

export const getPendingPhase = (pendingTx: PendingTx): PendingPhase => {
  switch (pendingTx.status) {
    case PendingStatus.SIGNING:
      return 'signing'
    case PendingStatus.NESTED_SIGNING:
      // The child tx is only queued in the parent Safe until its owners execute it
      return pendingTx.executed ? 'signing' : 'awaitingParent'
    case PendingStatus.SUBMITTING:
      return 'submitting'
    case PendingStatus.PROCESSING:
      return 'processing'
    case PendingStatus.RELAYING:
      return 'relaying'
    case PendingStatus.INDEXING:
      return 'indexing'
  }
}

/** Another transaction at the same Safe, chain and nonce that this browser is executing */
export const isNonceExecutingElsewhere = (
  pendingTxs: PendingTxsState,
  txId: string,
  { chainId, safeAddress, nonce }: { chainId: string; safeAddress: string; nonce: number },
): boolean =>
  Object.entries(pendingTxs).some(
    ([id, pendingTx]) =>
      id !== txId &&
      EXECUTING.has(pendingTx.status) &&
      pendingTx.chainId === chainId &&
      pendingTx.nonce === nonce &&
      sameAddress(pendingTx.safeAddress, safeAddress),
  )

export const useIsNonceExecutingElsewhere = (
  txId: string,
  chainId: string,
  safeAddress: string,
  nonce: number | undefined,
): boolean =>
  useAppSelector(
    (state) =>
      nonce !== undefined && isNonceExecutingElsewhere(selectPendingTxs(state), txId, { chainId, safeAddress, nonce }),
  )

/** A queue row's action while this browser signs or executes it: Speed up when the fee may be too low, else the chip */
export const PendingRowAction = ({ txId, pendingTx }: { txId: string; pendingTx: PendingTx }): ReactElement => {
  const phase = getPendingPhase(pendingTx)
  const processing = pendingTx.status === PendingStatus.PROCESSING
  const now = useNow(processing)
  const elapsedMs = processing ? now - pendingTx.submittedAt : 0
  const canSpeedUp = useIsSpeedUpAvailable(pendingTx)

  if (processing && canSpeedUp) {
    return (
      <SpeedUpMonitor
        txId={txId}
        pendingTx={pendingTx}
        modalTrigger="rowButton"
        hint={getPendingHint(phase, elapsedMs, true)}
      />
    )
  }

  return <PendingChip phase={phase} elapsedMs={elapsedMs} />
}

/** The row's action, disabled while another transaction at its nonce is executing */
export const NonceTakenAction = ({ tx, nonce }: { tx: Transaction; nonce: number }): ReactElement => (
  <NonceTakenButton label={isAwaitingExecution(tx.txStatus) ? 'Execute' : 'Sign'} nonce={nonce} />
)
