import { useEffect } from 'react'
import { useRouter } from 'next/router'
import { AppRoutes } from '@/config/routes'
import useIsBillingVisible from './useIsBillingVisible'

/** Redirects away from Billing when the feature is disabled; `undefined` (still loading) is a no-op to avoid flicker. */
const useBillingFeatureRedirect = (): void => {
  const router = useRouter()
  const isVisible = useIsBillingVisible()

  useEffect(() => {
    if (isVisible === false) {
      const spaceId = router.query.spaceId
      router.push({ pathname: AppRoutes.spaces.index, query: spaceId ? { spaceId } : undefined })
    }
  }, [isVisible, router])
}

export default useBillingFeatureRedirect
