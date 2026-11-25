import { Fragment, useState, useCallback, useMemo, Suspense } from 'react'
import dynamic from '@/utils/dynamic'
import { flattenSafeItems } from '@/hooks/safes/useAllSafesGrouped'
import type { SafeItem } from '@safe-global/views/hooks/safes/types'
import { useSpaceSafes } from '../../public/hooks/useSpaceSafes'
import { useSafeSignerCheck } from '../../hooks/useSafeSignerCheck'
import useSearchFilter from '@/hooks/useSearchFilter'
import useMatchSafe from '@/hooks/useMatchSafe'
import useChains from '@/hooks/useChains'
import useWallet from '@/hooks/wallets/useWallet'
import { CheckWalletMessage } from '@/components/common/CheckWallet'
import { useAppDispatch, useAppSelector } from '@/store'
import { selectUndeployedSafes } from '@/features/counterfactual/public/store/undeployedSafesSlice'
import {
  ESafeAction,
  selectSafeActionsModalOpen,
  selectSafeActionsModalType,
  closeSafeActionsModal,
} from '../../public/store/safeActionsModalSlice'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@safe-global/views/components/ui/dialog'
import { Skeleton } from '@safe-global/views/components/ui/skeleton'
import { Tooltip, TooltipContent, TooltipTrigger } from '@safe-global/views/components/ui/tooltip'
import SafeCardReadOnly from '../../public/components/SafeCardReadOnly'
import SafeSearch from './SafeSearch'
import useSafeActionMapper from './useSafeActionMapper'
import { NO_ACTIVATED_SAFES_MESSAGE, safeModalTitles } from './constants'
import { FEATURES, hasFeature } from '@safe-global/utils/utils/chains'

const SWAP_DISABLED_TOOLTIP = 'Swap is not supported on this chain. Try another chain.'

const QrModal = dynamic(() => import('@/components/common/QrCodeButton/QrModal'))

const SelectSafeModal = () => {
  const [query, setQuery] = useState('')
  const [qrOpen, setQrOpen] = useState(false)
  const opened = useAppSelector(selectSafeActionsModalOpen)
  const actionType = useAppSelector(selectSafeActionsModalType)
  const dispatch = useAppDispatch()

  const { allSafes, isLoading } = useSpaceSafes()
  const { configs: chains } = useChains()
  const undeployedSafes = useAppSelector(selectUndeployedSafes)
  const flatSafes = useMemo(() => flattenSafeItems(allSafes), [allSafes])
  const matchSafe = useMatchSafe()
  const isNewTxAction = actionType === ESafeAction.NewTransaction
  // Space flows can't handle counterfactual Safes (SafeScopeProvider); ones from other devices still show
  const selectableSafes = useMemo(
    () => flatSafes.filter((safe) => !undeployedSafes[safe.chainId]?.[safe.address]),
    [flatSafes, undeployedSafes],
  )
  const areAllSafesUndeployed = flatSafes.length > 0 && selectableSafes.length === 0
  const filteredSafes = useSearchFilter(selectableSafes, query, matchSafe)
  const wallet = useWallet()
  // flatSafes, not selectableSafes: the same Safe set shares the overviews cache entry with useSpaceSafes
  const getSignerStatus = useSafeSignerCheck(flatSafes, { skip: !opened || !isNewTxAction })
  const { actionMapper, resetActiveSafe } = useSafeActionMapper({
    onReceiveComplete: () => setQrOpen(true),
  })

  const handleQrClose = useCallback(() => {
    setQrOpen(false)
    void resetActiveSafe()
  }, [resetActiveSafe])

  const getDisabledState = useCallback(
    (safe: SafeItem): { disabled: boolean; tooltip?: string } => {
      if (actionType === ESafeAction.Swap) {
        const chain = chains.find((c) => c.chainId === safe.chainId)
        if (!chain || !hasFeature(chain, FEATURES.NATIVE_SWAPS))
          return { disabled: true, tooltip: SWAP_DISABLED_TOOLTIP }
        return { disabled: false }
      }

      // Same gate as the Safe-level New transaction button (CheckWallet)
      if (actionType === ESafeAction.NewTransaction) {
        if (!wallet) return { disabled: true, tooltip: CheckWalletMessage.WalletNotConnected }
        const status = getSignerStatus(safe)
        if (status === 'pending') return { disabled: true }
        if (status === 'not-signer') return { disabled: true, tooltip: CheckWalletMessage.NotSafeOwner }
      }

      return { disabled: false }
    },
    [actionType, chains, wallet, getSignerStatus],
  )

  const handleClose = useCallback(() => {
    dispatch(closeSafeActionsModal())
    setQuery('')
  }, [dispatch])

  const handleSafeClick = useCallback(
    async (safe: SafeItem) => {
      handleClose()
      await actionMapper[actionType](safe)
    },
    [actionMapper, actionType, handleClose],
  )

  return (
    <>
      {opened && (
        <Dialog open onOpenChange={(isOpen) => !isOpen && handleClose()}>
          <DialogContent padding="none" className="flex max-h-[520px] flex-col overflow-clip">
            <DialogHeader
              // eslint-disable-next-line no-restricted-syntax -- p-5 pb-0: bespoke header padding, no token
              className="shrink-0 p-5 pb-0"
            >
              <DialogTitle className="text-xl font-semibold">{safeModalTitles[actionType]}</DialogTitle>
            </DialogHeader>

            <div className="shrink-0 px-4 py-3">
              <SafeSearch value={query} onChange={setQuery} />
            </div>

            <div className="min-h-0 flex-1 overflow-y-auto px-4 pb-10">
              {isLoading ? (
                <div className="flex flex-col gap-1.5">
                  <Skeleton className="h-[72px] w-full rounded-3xl" />
                  <Skeleton className="h-[72px] w-full rounded-3xl" />
                  <Skeleton className="h-[72px] w-full rounded-3xl" />
                </div>
              ) : filteredSafes.length === 0 ? (
                <p className="py-8 text-center text-sm text-muted-foreground">
                  {areAllSafesUndeployed ? NO_ACTIVATED_SAFES_MESSAGE : 'No safes found'}
                </p>
              ) : (
                <div className="flex flex-col gap-1.5">
                  {filteredSafes.map((safe) => {
                    const { disabled, tooltip } = getDisabledState(safe)
                    const card = (
                      <SafeCardReadOnly
                        safe={safe}
                        hideContextMenu
                        showPending={false}
                        onClick={() => void handleSafeClick(safe)}
                        disabled={disabled}
                        className="px-4 sm:px-4"
                      />
                    )
                    const key = `${safe.chainId}:${safe.address}`
                    if (!tooltip) return <Fragment key={key}>{card}</Fragment>
                    // A block trigger: the card's own tooltip trigger is `display: contents`, which has no box to anchor to
                    return (
                      <Tooltip key={key}>
                        <TooltipTrigger render={<div />}>{card}</TooltipTrigger>
                        <TooltipContent>{tooltip}</TooltipContent>
                      </Tooltip>
                    )
                  })}
                </div>
              )}
            </div>

            <div className="pointer-events-none absolute inset-x-0 bottom-0 h-10 bg-gradient-to-t from-background to-transparent" />
          </DialogContent>
        </Dialog>
      )}

      {qrOpen && (
        <Suspense>
          <QrModal onClose={handleQrClose} />
        </Suspense>
      )}
    </>
  )
}

export default SelectSafeModal
