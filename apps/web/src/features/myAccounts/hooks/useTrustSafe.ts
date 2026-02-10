import { useCallback } from 'react'
import { useAppDispatch } from '@/store'
import { addOrUpdateSafe } from '@/store/addedSafesSlice'
import { upsertAddressBookEntries } from '@/store/addressBookSlice'
import { showNotification } from '@/store/notificationsSlice'
import { defaultSafeInfo } from '@safe-global/store/slices/SafeInfo/utils'
import { OVERVIEW_EVENTS, PIN_SAFE_LABELS, trackEvent } from '@/services/analytics'
import type { AddressInfo } from '@safe-global/store/gateway/AUTO_GENERATED/safes'

export interface TrustSafeParams {
  chainId: string
  address: string
  name?: string
  owners?: AddressInfo[]
  threshold?: number
}

/**
 * Hook that provides a function to add a Safe to the trusted list.
 *
 * Used by:
 * - SafeShieldContext (for untrusted Safe warning)
 * - useSafeSelectionModal (for single additions)
 *
 * @returns trustSafe - function to add a Safe to the trusted list
 */
export function useTrustSafe() {
  const dispatch = useAppDispatch()

  const trustSafe = useCallback(
    ({ chainId, address, name, owners, threshold }: TrustSafeParams) => {
      if (!chainId || !address) return

      dispatch(
        addOrUpdateSafe({
          safe: {
            ...defaultSafeInfo,
            chainId,
            address: { value: address },
            owners: owners ?? defaultSafeInfo.owners,
            threshold: threshold ?? defaultSafeInfo.threshold,
          },
        }),
      )

      if (name) {
        dispatch(
          upsertAddressBookEntries({
            chainIds: [chainId],
            address,
            name: name.trim(),
          }),
        )
      }

      dispatch(
        showNotification({
          title: 'Safe confirmed',
          message: 'This Safe has been added to your trusted list',
          groupKey: `pin-safe-success-${address}`,
          variant: 'success',
        }),
      )

      trackEvent({ ...OVERVIEW_EVENTS.PIN_SAFE, label: PIN_SAFE_LABELS.pin })
      trackEvent(OVERVIEW_EVENTS.TRUSTED_SAFES_ADDED)
    },
    [dispatch],
  )

  return { trustSafe }
}
