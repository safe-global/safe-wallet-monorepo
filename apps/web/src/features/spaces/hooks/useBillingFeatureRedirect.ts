import { useEffect } from 'react'
import { useRouter } from 'next/router'
import { AppRoutes } from '@/config/routes'
import useIsBillingVisible from './useIsBillingVisible'

/**
 * Redirects away from the Billing page when both GTF_PLANS and GTF are explicitly disabled.
 * `undefined` (chain config still loading) does nothing, so the page doesn't flicker through a
 * redirect on first paint.
 */
const useBillingFeatureRedirect = (): void => {
  const router = useRouter()
  const isVisible = useIsBillingVisible()

  useEffect(() => {
    if (isVisible === false) {
      // Keep the workspace context — without spaceId the spaces index bounces the user out.
      const spaceId = router.query.spaceId
      router.push({ pathname: AppRoutes.spaces.index, query: spaceId ? { spaceId } : undefined })
    }
  }, [isVisible, router])
}

export default useBillingFeatureRedirect
