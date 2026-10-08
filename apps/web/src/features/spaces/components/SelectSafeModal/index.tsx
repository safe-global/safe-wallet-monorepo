import { useState, useCallback, useMemo, Suspense } from 'react'
import dynamic from 'next/dynamic'
import { flattenSafeItems, type SafeItem } from '@/hooks/safes'
import { useSpaceSafes } from '@/features/spaces'
import useSearchFilter from '@/hooks/useSearchFilter'
import useMatchSafe from '@/hooks/useMatchSafe'
import useChains from '@/hooks/useChains'
import { useAppDispatch, useAppSelector } from '@/store'
import { selectUndeployedSafes } from '@/store/slices'
import {
  ESafeAction,
  selectSafeActionsModalOpen,
  selectSafeActionsModalType,
  closeSafeActionsModal,
} from '@/features/spaces/store'
import SafeCardReadOnly from '../SafeAccounts/SafeCardReadOnly'
import useSafeActionMapper from './useSafeActionMapper'
import { safeModalTitles } from './constants'
import { FEATURES, hasFeature } from '@safe-global/utils/utils/chains'
import {
  SelectSafeModalView,
  type SwapDisabledReason,
} from '@views/features/spaces/components/SelectSafeModal/SelectSafeModalView'

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
  const filteredSafes = useSearchFilter(flatSafes, query, matchSafe)
  const { actionMapper, resetActiveSafe } = useSafeActionMapper({
    onReceiveComplete: () => setQrOpen(true),
  })

  const handleQrClose = useCallback(() => {
    setQrOpen(false)
    void resetActiveSafe()
  }, [resetActiveSafe])

  const isSwapAction = actionType === ESafeAction.Swap
  const getSwapDisabledReason = useCallback(
    (safe: SafeItem): SwapDisabledReason | undefined => {
      if (!isSwapAction) return undefined
      const chain = chains.find((c) => c.chainId === safe.chainId)
      if (!chain || !hasFeature(chain, FEATURES.NATIVE_SWAPS)) return 'unsupportedChain'
      if (undeployedSafes[safe.chainId]?.[safe.address]) return 'notActivated'
      return undefined
    },
    [isSwapAction, chains, undeployedSafes],
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
        <SelectSafeModalView
          title={safeModalTitles[actionType]}
          query={query}
          onQueryChange={setQuery}
          onClose={handleClose}
          isLoading={isLoading}
          safes={filteredSafes}
          getSwapDisabledReason={getSwapDisabledReason}
          renderSafeCard={(safe, props) => (
            <SafeCardReadOnly
              key={`${safe.chainId}:${safe.address}`}
              safe={safe}
              hideContextMenu
              showPending={false}
              onClick={() => void handleSafeClick(safe)}
              {...props}
            />
          )}
        />
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
