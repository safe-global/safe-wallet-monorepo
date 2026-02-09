import { useCallback } from 'react'
import { useAppDispatch, useAppSelector } from '@/store'
import { showNotification } from '@/store/notificationsSlice'
import { addOrUpdateSafe, pinSafe, selectAllAddedSafes, unpinSafe } from '@/store/addedSafesSlice'
import { defaultSafeInfo } from '@safe-global/store/slices/SafeInfo/utils'
import { sameAddress } from '@safe-global/utils/utils/addresses'
import { shortenAddress } from '@safe-global/utils/utils/formatters'
import { OVERVIEW_EVENTS, PIN_SAFE_LABELS, trackEvent } from '@/services/analytics'
import type { SafeItem } from '@/hooks/safes'
import type { SafeOverview } from '@safe-global/store/gateway/AUTO_GENERATED/safes'

export function usePinActions(
  address: string,
  name: string | undefined,
  safes: SafeItem[],
  safeOverviews: SafeOverview[] | undefined,
) {
  const dispatch = useAppDispatch()
  const allAddedSafes = useAppSelector(selectAllAddedSafes)

  const findOverview = useCallback(
    (item: SafeItem) => {
      return safeOverviews?.find(
        (overview) => item.chainId === overview.chainId && sameAddress(overview.address.value, item.address),
      )
    },
    [safeOverviews],
  )

  const addToPinnedList = useCallback(() => {
    for (const safe of safes) {
      const isAlreadyAdded = allAddedSafes[safe.chainId]?.[safe.address]

      if (!isAlreadyAdded) {
        const overview = findOverview(safe)
        dispatch(
          addOrUpdateSafe({
            safe: {
              ...defaultSafeInfo,
              chainId: safe.chainId,
              address: { value: address },
              owners: overview?.owners ?? defaultSafeInfo.owners,
              threshold: overview?.threshold ?? defaultSafeInfo.threshold,
            },
          }),
        )
      }

      dispatch(pinSafe({ chainId: safe.chainId, address: safe.address }))
    }

    dispatch(
      showNotification({
        title: 'Trusted multi-chain Safe',
        message: name ?? shortenAddress(address),
        groupKey: `pin-safe-success-${address}`,
        variant: 'success',
      }),
    )

    trackEvent({ ...OVERVIEW_EVENTS.PIN_SAFE, label: PIN_SAFE_LABELS.pin })
  }, [name, safes, allAddedSafes, dispatch, findOverview, address])

  const removeFromPinnedList = useCallback(() => {
    for (const safe of safes) {
      dispatch(unpinSafe({ chainId: safe.chainId, address: safe.address }))
    }

    dispatch(
      showNotification({
        title: 'Removed multi-chain Safe',
        message: name ?? shortenAddress(address),
        groupKey: `unpin-safe-success-${address}`,
        variant: 'success',
      }),
    )

    trackEvent({ ...OVERVIEW_EVENTS.PIN_SAFE, label: PIN_SAFE_LABELS.unpin })
  }, [dispatch, name, address, safes])

  return { addToPinnedList, removeFromPinnedList }
}
