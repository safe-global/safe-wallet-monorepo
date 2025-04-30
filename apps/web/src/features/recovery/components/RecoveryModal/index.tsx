import { Backdrop, Fade } from '@mui/material'
import { useCallback, useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/router'
import type { ReactElement } from 'react'

import { useRecoveryQueue } from '@/features/recovery/hooks/useRecoveryQueue'
import { RecoveryInProgressCard } from '../RecoveryCards/RecoveryInProgressCard'
import { RecoveryProposalCard } from '../RecoveryCards/RecoveryProposalCard'
import useIsSafeOwner from '@/hooks/useIsSafeOwner'
import { useIsRecoverer } from '@/features/recovery/hooks/useIsRecoverer'
import madProps from '@/utils/mad-props'
import useLocalStorage from '@/services/local-storage/useLocalStorage'
import useWallet from '@/hooks/wallets/useWallet'
import useSafeInfo from '@/hooks/useSafeInfo'
import { sameAddress } from '@safe-global/utils/utils/addresses'
import { useIsSidebarRoute } from '@/hooks/useIsSidebarRoute'
import type { RecoveryQueueItem } from '@/features/recovery/services/recovery-state'

export function InternalRecoveryModal({
  isOwner,
  isRecoverer,
  queue,
  wallet,
  isSidebarRoute = true,
}: {
  isOwner: boolean
  isRecoverer: boolean
  queue: Array<RecoveryQueueItem>
  wallet: ReturnType<typeof useWallet>
  isSidebarRoute?: boolean
}): ReactElement {
  const { wasProposalDismissed, dismissProposal } = useDidDismissProposal()
  const { wasInProgressDismissed, dismissInProgress } = useDidDismissInProgress()

  const [modal, setModal] = useState<ReactElement | null>(null)
  const router = useRouter()

  const next = queue[0]

  // Close modal
  const onClose = () => {
    setModal(null)
  }

  // Trigger modal
  useEffect(() => {
    if (!isSidebarRoute) {
      return
    }

    setModal(() => {
      if (next && (isOwner || isRecoverer) && !wasInProgressDismissed(next.transactionHash)) {
        const onCloseWithDismiss = () => {
          dismissInProgress(next.transactionHash)
          onClose()
        }

        return <RecoveryInProgressCard onClose={onCloseWithDismiss} recovery={next} />
      }

      if (wallet?.address && isRecoverer && !wasProposalDismissed(wallet.address)) {
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
    isRecoverer,
    isOwner,
    next,
    queue.length,
    router.pathname,
    wallet,
    wasInProgressDismissed,
    wasProposalDismissed,
    isSidebarRoute,
  ])

  // Close modal on navigation
  useEffect(() => {
    router.events.on('routeChangeComplete', onClose)
    return () => {
      router.events.off('routeChangeComplete', onClose)
    }
  }, [router])

  return (
    <Fade in={!!modal}>
      <Backdrop open={!!modal} sx={{ zIndex: 3, bgcolor: ({ palette }) => palette.background.main }}>
        {modal}
      </Backdrop>
    </Fade>
  )
}

const useSidebar = () => {
  const [isSidebarRoute] = useIsSidebarRoute()
  return isSidebarRoute
}

export const RecoveryModal = madProps(InternalRecoveryModal, {
  isOwner: useIsSafeOwner,
  isRecoverer: useIsRecoverer,
  queue: useRecoveryQueue,
  wallet: useWallet,
  isSidebarRoute: useSidebar,
})

export function useDidDismissProposal() {
  const LS_KEY = 'dismissedRecoveryProposals'

  type Recoverer = string
  type DismissedProposalCache = { [chainId: string]: { [safeAddress: string]: Recoverer } }

  const { safe, safeAddress } = useSafeInfo()
  const chainId = safe.chainId

  const [dismissedProposals, setDismissedProposals] = useLocalStorage<DismissedProposalCache>(LS_KEY)

  // Cache dismissal of proposal modal
  const dismissProposal = useCallback(
    (recovererAddress: string) => {
      const dismissed = dismissedProposals?.[chainId] ?? {}

      setDismissedProposals({
        ...(dismissedProposals ?? {}),
        [chainId]: {
          ...dismissed,
          [safeAddress]: recovererAddress,
        },
      })
    },
    [dismissedProposals, chainId, safeAddress, setDismissedProposals],
  )

  const wasProposalDismissed = useCallback(
    (recovererAddress: string) => {
      // If no proposals, is recoverer and didn't ever dismiss
      return sameAddress(dismissedProposals?.[chainId]?.[safeAddress], recovererAddress)
    },
    [chainId, dismissedProposals, safeAddress],
  )

  return { wasProposalDismissed, dismissProposal }
}

export function useDidDismissInProgress() {
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
