import { useCallback, useEffect } from 'react'
import { useRouter } from 'next/router'
import { useStore } from 'react-redux'
import { useAppDispatch, type RootState } from '@/store'
import { selectStepUpPhase, stepUpReturnUrlCleared, stepUpReturnUrlSet } from '@/features/oidc-auth/store'
import type { SafeRef } from '../../components/Plans/types'
import { useSeatTrim } from './useSeatTrim'
import { useStartCheckout } from './useStartCheckout'

const RESUME_CHECKOUT_PARAM = 'resumeCheckout'
const RESUME_CHECKOUT_SEATS_PARAM = 'resumeCheckoutSeats'

export const useSeatTrimCheckout = (spaceId: string, returnPathname?: string) => {
  const router = useRouter()
  const dispatch = useAppDispatch()
  const store = useStore<RootState>()
  const { seatCount, isLoaded, needsTrim, trim, isTrimming, error: trimError } = useSeatTrim(spaceId)
  const { startCheckout, isRedirecting, isError: isCheckoutError } = useStartCheckout(spaceId, returnPathname)

  const checkout = useCallback(
    async (paymentLinkId: string, removed: SafeRef[] = [], seats?: number): Promise<boolean> => {
      if (removed.length > 0) {
        // The step-up replays only the removal, so it returns here with the checkout still to start.
        const url = new URL(window.location.href)
        url.searchParams.set(RESUME_CHECKOUT_PARAM, paymentLinkId)
        if (seats !== undefined) url.searchParams.set(RESUME_CHECKOUT_SEATS_PARAM, String(seats))
        const stepUpReturnUrl = `${url.pathname}${url.search}`
        dispatch(stepUpReturnUrlSet(stepUpReturnUrl))
        const trimmed = await trim(removed)
        if (!trimmed && selectStepUpPhase(store.getState()) === 'leaving') return false
        dispatch(stepUpReturnUrlCleared(stepUpReturnUrl))
        if (!trimmed) return false
      }
      await startCheckout(paymentLinkId)
      return true
    },
    [dispatch, store, trim, startCheckout],
  )

  const resumePaymentLinkId = router.query[RESUME_CHECKOUT_PARAM]
  const resumeSeats = Number(router.query[RESUME_CHECKOUT_SEATS_PARAM])

  useEffect(() => {
    if (typeof resumePaymentLinkId !== 'string' || !Number.isInteger(resumeSeats)) return
    // Waits for the replayed removal, so the checkout never starts with more Safes than the plan covers.
    if (!isLoaded || needsTrim(resumeSeats)) return
    const { [RESUME_CHECKOUT_PARAM]: _paymentLinkId, [RESUME_CHECKOUT_SEATS_PARAM]: _seats, ...query } = router.query
    router.replace({ pathname: router.pathname, query }, undefined, { shallow: true })
    void startCheckout(resumePaymentLinkId)
  }, [resumePaymentLinkId, resumeSeats, isLoaded, needsTrim, router, startCheckout])

  const error = trimError ?? (isCheckoutError ? 'We couldn’t start the checkout. Please try again.' : undefined)

  return { seatCount, needsTrim, checkout, isBusy: isRedirecting || isTrimming, error }
}
