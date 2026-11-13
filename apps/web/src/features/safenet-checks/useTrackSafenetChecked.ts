import { useEffect } from 'react'
import type {
  NormalizedCheckEvent,
  PublicCheckStatus,
  UnavailableReason,
} from '@safe-global/utils/features/safenet-checks'
import type { CheckIdentity } from '@safe-global/store/safenet/safenetCheckSlice'
import type { SafenetSignerRole } from '@/services/analytics'
import { trackSafenetChecked } from './trackSafenetChecked'

type TrackSafenetCheckedInput = {
  identity: Omit<CheckIdentity, 'safeTxHash'> & { safeTxHash: string | undefined }
  publicStatus: PublicCheckStatus | undefined
  unavailableReason?: UnavailableReason
  events: ReadonlyArray<NormalizedCheckEvent> | undefined
  /** The hash the snapshot was read for; RTK Query keeps the previous snapshot while a new hash loads. */
  snapshotTxHash: string | undefined
  signerRole: SafenetSignerRole | undefined
  isShown: boolean
}

export const useTrackSafenetChecked = ({
  identity,
  publicStatus,
  unavailableReason,
  events,
  snapshotTxHash,
  signerRole,
  isShown,
}: TrackSafenetCheckedInput): void => {
  const { chainId, safeAddress, safeTxHash } = identity

  useEffect(() => {
    if (!isShown || !publicStatus || !safeTxHash) return
    if (snapshotTxHash && snapshotTxHash.toLowerCase() !== safeTxHash.toLowerCase()) return
    trackSafenetChecked({
      identity: { chainId, safeAddress, safeTxHash },
      publicStatus,
      unavailableReason,
      events: events ?? [],
      signerRole,
    })
  }, [isShown, chainId, safeAddress, safeTxHash, snapshotTxHash, publicStatus, unavailableReason, events, signerRole])
}
