import { useCallback, useMemo } from 'react'
import {
  useSpaceSafesDeleteV1Mutation,
  useSpaceSafesGetV1Query,
} from '@safe-global/store/gateway/AUTO_GENERATED/spaces'
import { getRtkQueryErrorMessage } from '@/utils/rtkQuery'
import type { SafeRef } from '../../components/Plans/types'
import { useStartCheckout } from './useStartCheckout'

/**
 * Checkout for a seat-limited offer: `needsTrim` tells whether the accounts step is shown (the Workspace holds more
 * Safes than the plan covers), `checkout` removes the Safes left out (they stay in My accounts) and then goes to Stripe.
 */
export const useSeatTrimCheckout = (spaceId: string, returnPathname?: string) => {
  const { currentData: spaceSafes } = useSpaceSafesGetV1Query({ spaceId })
  const { startCheckout, isRedirecting, isError: isCheckoutError } = useStartCheckout(spaceId, returnPathname)
  const [removeSafes, { isLoading: isRemoving, error: removeError }] = useSpaceSafesDeleteV1Mutation()

  const safeCount = useMemo(
    () => Object.values(spaceSafes?.safes ?? {}).reduce((total, addresses) => total + addresses.length, 0),
    [spaceSafes],
  )

  const needsTrim = useCallback(
    (seats: number | null | undefined): seats is number => seats != null && safeCount > seats,
    [safeCount],
  )

  const checkout = useCallback(
    async (paymentLinkId: string, removed: SafeRef[] = []): Promise<boolean> => {
      if (removed.length > 0) {
        const result = await removeSafes({ spaceId, deleteSpaceSafesDto: { safes: removed } })
        if (result.error) return false
      }
      await startCheckout(paymentLinkId)
      return true
    },
    [removeSafes, spaceId, startCheckout],
  )

  const error = removeError
    ? getRtkQueryErrorMessage(removeError) || 'We couldn’t update the Workspace. Please try again.'
    : isCheckoutError
      ? 'We couldn’t start the checkout. Please try again.'
      : undefined

  return { safeCount, needsTrim, checkout, isBusy: isRedirecting || isRemoving, error }
}
