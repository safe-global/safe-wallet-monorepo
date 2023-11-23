import { Backdrop, Fade } from '@mui/material'
import { useCallback, useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/router'
import type { ReactElement, ReactNode } from 'react'

import { useRecoveryQueue } from '@/hooks/useRecoveryQueue'
import { RecoveryInProgressCard } from '../RecoveryCards/RecoveryInProgressCard'
import { RecoveryProposalCard } from '../RecoveryCards/RecoveryProposalCard'
import useIsSafeOwner from '@/hooks/useIsSafeOwner'
import { useIsGuardian } from '@/hooks/useIsGuardian'
import madProps from '@/utils/mad-props'
import useLocalStorage from '@/services/local-storage/useLocalStorage'
import useWallet from '@/hooks/wallets/useWallet'
import useSafeInfo from '@/hooks/useSafeInfo'
import { sameAddress } from '@/utils/addresses'
import type { RecoveryQueueItem } from '@/components/recovery/RecoveryContext'

export function _RecoveryModal({
  children,
  isOwner,
  isGuardian,
  queue,
  wallet,
}: {
  children: ReactNode
  isOwner: boolean
  isGuardian: boolean
  queue: Array<RecoveryQueueItem>
  wallet: ReturnType<typeof useWallet>
}): ReactElement {
  const { wasProposalDismissed, dismissProposal } = _useDidDismissProposal()
  const { wasInProgressDismissed, dismissInProgress } = _useDidDismissInProgress()

  const [modal, setModal] = useState<ReactElement | null>(null)
  const router = useRouter()

  const next = queue[0]

  // Close modal
  const onClose = () => {
    setModal(null)
  }

  // Trigger modal
  useEffect(() => {
    setModal(() => {
      if (next && !wasInProgressDismissed(next.transactionHash)) {
        const onCloseWithDismiss = () => {
          dismissInProgress(next.transactionHash)
          onClose()
        }

        return <RecoveryInProgressCard onClose={onCloseWithDismiss} recovery={next} />
      }

      if (wallet?.address && !isOwner && !wasProposalDismissed(wallet.address)) {
        const onCloseWithDismiss = () => {
          dismissProposal(wallet.address)
          onClose()
        }

        return <RecoveryProposalCard onClose={onCloseWithDismiss} />
      }

      return null
    })
  }, [
    dismissInProgress,
    dismissProposal,
    isGuardian,
    isOwner,
    next,
    queue.length,
    wallet,
    wasInProgressDismissed,
    wasProposalDismissed,
  ])

  // Close modal on navigation
  useEffect(() => {
    router.events.on('routeChangeComplete', onClose)
    return () => {
      router.events.off('routeChangeComplete', onClose)
    }
  }, [router])

  return (
    <>
      <Fade in={!!modal}>
        <Backdrop open={!!modal} sx={{ zIndex: 3, bgcolor: ({ palette }) => palette.background.main }}>
          {modal}
        </Backdrop>
      </Fade>
      {children}
    </>
  )
}

export const RecoveryModal = madProps(_RecoveryModal, {
  isOwner: useIsSafeOwner,
  isGuardian: useIsGuardian,
  queue: useRecoveryQueue,
  wallet: useWallet,
})

export function _useDidDismissProposal() {
  const LS_KEY = 'dismissedRecoveryProposals'

  type Guardian = string
  type DismissedProposalCache = { [chainId: string]: { [safeAddress: string]: Guardian } }

  const { safe, safeAddress } = useSafeInfo()
  const chainId = safe.chainId

  const [dismissedProposals, setDismissedProposals] = useLocalStorage<DismissedProposalCache>(LS_KEY)

  // Cache dismissal of proposal modal
  const dismissProposal = useCallback(
    (guardianAddress: string) => {
      const dismissed = dismissedProposals?.[chainId] ?? {}

      setDismissedProposals({
        ...(dismissedProposals ?? {}),
        [chainId]: {
          ...dismissed,
          [safeAddress]: guardianAddress,
        },
      })
    },
    [dismissedProposals, chainId, safeAddress, setDismissedProposals],
  )

  const wasProposalDismissed = useCallback(
    (guardianAddress: string) => {
      // If no proposals, is guardian and didn't ever dismiss
      return sameAddress(dismissedProposals?.[chainId]?.[safeAddress], guardianAddress)
    },
    [chainId, dismissedProposals, safeAddress],
  )

  return { wasProposalDismissed, dismissProposal }
}

export function _useDidDismissInProgress() {
  type TxHash = string
  type DismissedInProgressCache = { [chainId: string]: { [safeAddress: string]: TxHash } }

  const { safe, safeAddress } = useSafeInfo()
  const chainId = safe.chainId

  const dismissedInProgress = useRef<DismissedInProgressCache>({})

  // Cache dismissal of in-progress modal
  const dismissInProgress = useCallback(
    (txHash: string) => {
      const dismissed = dismissedInProgress.current?.[chainId] ?? {}

      dismissedInProgress.current = {
        ...dismissedInProgress.current,
        [chainId]: {
          ...dismissed,
          [safeAddress]: txHash,
        },
      }
    },
    [chainId, safeAddress],
  )

  const wasInProgressDismissed = useCallback(
    (txHash: string) => {
      // If proposal and did not notify during current session of Safe
      return sameAddress(txHash, dismissedInProgress.current?.[chainId]?.[safeAddress])
    },
    [chainId, safeAddress],
  )

  return { wasInProgressDismissed, dismissInProgress }
}
