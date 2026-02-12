import { useCallback } from 'react'
import type { MouseEvent } from 'react'
import { useAppDispatch } from '@/store'
import { addOrUpdateSafe, unpinSafe } from '@/store/addedSafesSlice'
import { showNotification } from '@/store/notificationsSlice'
import { shortenAddress } from '@safe-global/utils/utils/formatters'
import { defaultSafeInfo } from '@safe-global/store/slices/SafeInfo/utils'
import { OVERVIEW_EVENTS, PIN_SAFE_LABELS, trackEvent } from '@/services/analytics'
import type { AddressInfo } from '@safe-global/store/gateway/AUTO_GENERATED/safes'

export interface UseSingleChainPinActionsProps {
  address: string
  chainId: string
  name?: string
  isPinned: boolean
  threshold: number
  owners: AddressInfo[]
}

export function useSingleChainPinActions({
  address,
  chainId,
  name,
  isPinned,
  threshold,
  owners,
}: UseSingleChainPinActionsProps) {
  const dispatch = useAppDispatch()

  const handlePinClick = useCallback(
    (e: MouseEvent) => {
      e.stopPropagation()
      e.preventDefault()

      if (isPinned) {
        dispatch(unpinSafe({ chainId, address }))
        dispatch(
          showNotification({
            title: 'Safe removed',
            message: name ?? shortenAddress(address),
            groupKey: `unpin-safe-success-${address}`,
            variant: 'success',
          }),
        )
        trackEvent({ ...OVERVIEW_EVENTS.PIN_SAFE, label: PIN_SAFE_LABELS.unpin })
      } else {
        dispatch(
          addOrUpdateSafe({
            safe: {
              ...defaultSafeInfo,
              chainId,
              address: { value: address },
              owners,
              threshold,
            },
          }),
        )
        dispatch(
          showNotification({
            title: 'Safe trusted',
            message: name ?? shortenAddress(address),
            groupKey: `pin-safe-success-${address}`,
            variant: 'success',
          }),
        )
        trackEvent({ ...OVERVIEW_EVENTS.PIN_SAFE, label: PIN_SAFE_LABELS.pin })
      }
    },
    [dispatch, address, chainId, name, isPinned, threshold, owners],
  )

  return { handlePinClick }
}
