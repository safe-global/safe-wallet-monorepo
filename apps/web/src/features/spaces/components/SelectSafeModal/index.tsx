import { useState, useCallback, useMemo, Suspense } from 'react'
import dynamic from 'next/dynamic'
import { flattenSafeItems, type SafeItem } from '@/hooks/safes'
import { useSpaceSafes } from '@/features/spaces'
import useSearchFilter from '@/hooks/useSearchFilter'
import useMatchSafe from '@/hooks/useMatchSafe'
import useChains from '@/hooks/useChains'
import { useAppDispatch, useAppSelector } from '@/store'
import {
  ESafeAction,
  selectSafeActionsModalOpen,
  selectSafeActionsModalType,
  closeSafeActionsModal,
} from '@/features/spaces/store'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Skeleton } from '@/components/ui/skeleton'
import SafeCardReadOnly from '../SafeAccounts/SafeCardReadOnly'
import SafeSearch from './SafeSearch'
import useSafeActionMapper from './useSafeActionMapper'
import { safeModalTitles } from './constants'
import { FEATURES, hasFeature } from '@safe-global/utils/utils/chains'

const SWAP_DISABLED_TOOLTIP = 'Swap is not supported on this chain. Try another chain.'

const QrModal = dynamic(() => import('@/components/sidebar/QrCodeButton/QrModal'))

const SelectSafeModal = () => {
  const [query, setQuery] = useState('')
  const [qrOpen, setQrOpen] = useState(false)
  const opened = useAppSelector(selectSafeActionsModalOpen)
  const actionType = useAppSelector(selectSafeActionsModalType)
  const dispatch = useAppDispatch()

  const { allSafes, isLoading } = useSpaceSafes()
  const { configs: chains } = useChains()
  const flatSafes = useMemo(() => flattenSafeItems(allSafes), [allSafes])
  const matchSafe = useMatchSafe()
  const filteredSafes = useSearchFilter(flatSafes, query, matchSafe)
  const { actionMapper, resetActiveSafe } = useSafeActionMapper({
    onReceiveComplete: () => setQrOpen(true),
  })

  const handleQrClose = useCallback(() => {
    setQrOpen(false)
    void resetActiveSafe()
  }, [resetActiveSafe])

  const isSwapAction = actionType === ESafeAction.Swap
  const isSwapDisabledForSafe = useCallback(
    (safe: SafeItem) => {
      if (!isSwapAction) return false
      const chain = chains.find((c) => c.chainId === safe.chainId)
      return !chain || !hasFeature(chain, FEATURES.NATIVE_SWAPS)
    },
    [isSwapAction, chains],
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
          <DialogContent className="flex max-h-[520px] flex-col gap-0 overflow-clip p-0">
            <DialogHeader className="shrink-0 p-5 pb-0">
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
                <p className="py-8 text-center text-sm text-muted-foreground">No safes found</p>
              ) : (
                <div className="flex flex-col gap-1.5">
                  {filteredSafes.map((safe) => {
                    const disabled = isSwapDisabledForSafe(safe)
                    return (
                      <SafeCardReadOnly
                        key={`${safe.chainId}:${safe.address}`}
                        safe={safe}
                        hideContextMenu
                        showPending={false}
                        onClick={() => void handleSafeClick(safe)}
                        disabled={disabled}
                        disabledTooltip={disabled ? SWAP_DISABLED_TOOLTIP : undefined}
                        className="px-4 sm:px-4"
                      />
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
